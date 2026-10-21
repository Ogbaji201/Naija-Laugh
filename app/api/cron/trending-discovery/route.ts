
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openai } from "@/lib/openai";

const FEED_URL =
  "https://trends.google.com/trending/rss?geo=NG";

const SOURCE_NAME = "Google Trends Nigeria";
const MODEL = "gpt-6-luna";

type Candidate = {
  topic: string;
  traffic: string | null;
  articleTitle: string | null;
  articleUrl: string | null;
  imageUrl: string | null;
  articleSource: string | null;
};

type GeneratedDescription = {
  topic: string;
  description: string;
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .trim();
}

function getTag(block: string, tag: string): string | null {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = block.match(
    new RegExp(
      `<${escapedTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escapedTag}\\s*>`,
      "i"
    )
  );

  return match
    ? decodeXml(match[1].replace(/<[^>]+>/g, ""))
    : null;
}

function validUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function parseFeed(xml: string): Candidate[] {
  const blocks =
    xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];

  return blocks.flatMap((block) => {
    const topic = getTag(block, "title");

    if (!topic) return [];

    const newsBlock = block.match(
      /<ht:news_item(?:\s[^>]*)?>[\s\S]*?<\/ht:news_item>/i
    )?.[0];

    return [{
      topic,
      traffic: getTag(block, "ht:approx_traffic"),
      articleTitle: newsBlock
        ? getTag(newsBlock, "ht:news_item_title")
        : null,
      articleUrl: validUrl(
        newsBlock ? getTag(newsBlock, "ht:news_item_url") : null
      ),
      imageUrl: validUrl(
        newsBlock ? getTag(newsBlock, "ht:news_item_picture") : null
      ),
      articleSource: newsBlock
        ? getTag(newsBlock, "ht:news_item_source")
        : null,
    }];
  });
}

function parseJsonArray(text: string): GeneratedDescription[] {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  const parsed: unknown = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON array.");
  }

  return parsed.filter(
    (item): item is GeneratedDescription =>
      typeof item?.topic === "string" &&
      typeof item?.description === "string"
  );
}

function descriptionNeedsImprovement(value: string | null | undefined) {
  if (!value?.trim()) return true;

  const text = value.trim().toLowerCase();

  const genericPhrases = [
    "the headline does not",
    "the headline covers",
    "the headline reports",
    "the headline does not provide",
    "is providing live updates",
    "more reporting is needed",
    "the linked report gives",
  ];

  return genericPhrases.some((phrase) => text.includes(phrase));
}

async function generateDescriptions(
  items: Candidate[]
): Promise<Map<string, string>> {
  if (items.length === 0) return new Map();

  const aiResponse = await openai.responses.create({
    model: MODEL,
    input: [
      {
        role: "system",
        content: `
You are the senior digital editor for NaijaLaughs, a Nigerian news and
trending website. Write natural, engaging, accurate explanations that help
readers quickly understand why a topic matters.

STYLE:
- Write 2 or 3 concise sentences, usually 35–65 words.
- Start directly with the event, development, person, match or issue.
- Explain what is happening and why people may care, using only the
  supplied information.
- Use clear, conversational English suitable for Nigerian and international
  readers.
- Sound like a skilled human news editor, not an RSS feed or a robot.
- Use the topic and linked headline naturally.
- For sports, explain the fixture, competition or reported development.
- For entertainment, explain the release, event or reported development.
- For public affairs, explain the reported issue without taking sides.
- Do not add jokes or sensational claims simply because the site is called
  NaijaLaughs. Accuracy comes first.

STRICT FACTUAL RULES:
- The supplied information may be incomplete. Do not invent results, scores,
  dates, earnings, quotations, allegations, causes, consequences or details.
- A trend title alone does not prove that an event has happened.
- Do not pretend you have read the full linked article. You only have the
  supplied topic, headline and publisher.
- Do not use filler such as "the headline does not specify", "the report
  provides live updates", "people are talking about this", or "more reporting
  is needed".

- Do not use filter such "the linked report gives", "the headline covers", "the headline reports", or
  "the headline does not provide" in your explanation.

- Make it comical and also humorous, but do not make up information. If the topic is about a person, event, or issue, you can add a humorous observation about the situation without inventing facts.

- If the information is too limited for a useful explanation, write a short,
  honest description of what the topic refers to without guessing.
- Do not claim that a team has won, qualified or been eliminated unless the
  supplied information establishes that fact.
- Do not repeat the same generic explanation across different topics.

Return ONLY a valid JSON array. Each object must contain:
{"topic":"exact supplied topic","description":"the explanation"}
        `.trim(),
      },
      {
        role: "user",
        content: JSON.stringify(
          items.map((item) => ({
            topic: item.topic,
            linkedNewsHeadline: item.articleTitle,
            newsPublisher: item.articleSource,
          }))
        ),
      },
    ],
  });

  const generated = parseJsonArray(aiResponse.output_text);

  return new Map(
    generated.map((item) => [
      item.topic.trim().toLowerCase(),
      item.description.trim(),
    ])
  );
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 }
    );
  }

  if (
    request.headers.get("authorization") !== `Bearer ${secret}`
  ) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(FEED_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent": "NaijaLaughs-TrendingDiscovery/1.0",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(
        `Google Trends returned HTTP ${response.status}.`
      );
    }

    const candidates = parseFeed(await response.text());

    if (candidates.length === 0) {
      throw new Error(
        "No readable topics were found in the Google Trends feed."
      );
    }

    const supabase = createAdminClient();

    const { data: existing, error: lookupError } = await supabase
      .from("trending_topics")
      .select(
        "id, topic, description, image_url, article_url, verified"
      );

    if (lookupError) throw new Error(lookupError.message);

    const existingByTopic = new Map(
      (existing ?? []).map((row) => [
        row.topic.trim().toLowerCase(),
        row,
      ])
    );

    const uniqueCandidates = [
      ...new Map(
        candidates.map((item) => [
          item.topic.trim().toLowerCase(),
          item,
        ])
      ).values(),
    ];

    // Generate descriptions for new topics and weak existing descriptions.
    // Do not overwrite descriptions that an editor has already improved.
    const needsDescription = uniqueCandidates.filter((item) => {
      const saved = existingByTopic.get(
        item.topic.trim().toLowerCase()
      );

      if (saved?.verified) return false;

      return (
        !saved ||
        descriptionNeedsImprovement(saved.description)
      );
    });

    const descriptions = await generateDescriptions(needsDescription);

    const newRows: Array<Record<string, unknown>> = [];
    const updates: Array<{
      id: string;
      patch: Record<string, unknown>;
    }> = [];

    for (const item of uniqueCandidates) {
      const key = item.topic.trim().toLowerCase();
      const saved = existingByTopic.get(key);
      const generatedDescription = descriptions.get(key) ?? null;

      if (saved) {
        const patch: Record<string, unknown> = {};

        if (
          !saved.verified &&
          generatedDescription &&
          descriptionNeedsImprovement(saved.description)
        ) {
          patch.description = generatedDescription;
        }

        if (!saved.image_url && item.imageUrl) {
          patch.image_url = item.imageUrl;
          patch.image_alt = `News image related to ${item.topic}`;
        }

        if (!saved.article_url && item.articleUrl) {
          patch.article_url = item.articleUrl;
        }

        if (Object.keys(patch).length > 0) {
          updates.push({ id: saved.id, patch });
        }

        continue;
      }

      newRows.push({
        topic: item.topic,
        source: SOURCE_NAME,
        source_url: item.articleUrl ?? FEED_URL,
        article_url: item.articleUrl,
        description: generatedDescription,
        image_url: item.imageUrl,
        image_alt: item.imageUrl
          ? `News image related to ${item.topic}`
          : null,
        region: "Nigeria",
        engagement_data: item.traffic
          ? { score: item.traffic }
          : null,
        verified: false,
      });
    }

    let updated = 0;

    for (const item of updates) {
      const { error } = await supabase
        .from("trending_topics")
        .update(item.patch)
        .eq("id", item.id);

      if (error) throw new Error(error.message);
      updated++;
    }

    if (newRows.length > 0) {
      const { error } = await supabase
        .from("trending_topics")
        .insert(newRows);

      if (error) throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      source: SOURCE_NAME,
      fetched: candidates.length,
      inserted: newRows.length,
      enrichedExisting: updated,
      descriptionsGenerated: descriptions.size,
      message:
        "Discovery completed. New topics remain unverified; verified topics are not automatically rewritten.",
    });
  } catch (error) {
    console.error("Trending discovery failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Trending discovery failed.",
      },
      { status: 500 }
    );
  }
}
