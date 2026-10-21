import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { openai } from "@/lib/openai";


type FetchedArticle = {
  title: string | null;
  text: string;
  url: string;
};

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number(code))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    );
}

function htmlToText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim()
  );
}

function extractArticleContent(html: string) {
  const selectors = [
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<div\b[^>]*(?:class|id)=["'][^"']*(?:entry-content|td-post-content|post-content|article-content|single-post-content)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
  ];

  for (const selector of selectors) {
    const match = html.match(selector);

    if (match?.[1]) {
      const content = htmlToText(match[1]);

      if (content.length >= 500) {
        return content;
      }
    }
  }

  return htmlToText(html);
}

async function fetchArticle(url: string): Promise<FetchedArticle> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; NaijaLaughsNewsBot/1.0; +https://naijalaughs.com)",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Could not fetch source article (${response.status} ${response.statusText}).`
    );
  }

  const html = await response.text();

  if (!html.trim()) {
    throw new Error("The source article returned an empty response.");
  }

  const titleMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );

  const articleTitle = titleMatch?.[1]
    ? decodeHtml(titleMatch[1]).trim()
    : null;

  const articleText = extractArticleContent(html);

  if (articleText.length < 500) {
    throw new Error(
      "The source article could not be extracted. Please verify that the article URL is publicly accessible."
    );
  }

  return {
    title: articleTitle,
    text: articleText.slice(0, 30000),
    url,
  };
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MODEL = "gpt-6-luna";
const PROMPT_VERSION = "naijalaughs-editorial-v1";

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id: storyId } = await params;

    if (!storyId) {
      return NextResponse.json(
        {
          error: "Story ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = createAdminClient();

    /* =====================================================
       LOAD STORY
       ===================================================== */

    const {
      data: story,
      error: storyError,
    } = await supabase
      .from("stories")
      .select(`
        id,
        title,
        summary,
        region,
        status,
        event_date,
        category:categories (
          id,
          name,
          slug
        )
      `)
      .eq("id", storyId)
      .single();

    if (storyError || !story) {
      console.error(
        "Story fetch error:",
        storyError
      );

      return NextResponse.json(
        {
          error: "Story could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       LOAD ATTACHED SOURCE MATERIAL
       ===================================================== */

    const {
      data: storySources,
      error: sourcesError,
    } = await supabase
      .from("story_sources")
      .select(`
        news_item_id,
        news_item:news_items (
          id,
          title,
          url,
          excerpt,
          published_at,
          source:sources (
            name,
            website
          )
        )
      `)
      .eq("story_id", storyId);

    if (sourcesError) {
      console.error(
        "Story sources fetch error:",
        sourcesError
      );

      return NextResponse.json(
        {
          error:
            "Could not retrieve the story source material.",
        },
        {
          status: 500,
        }
      );
    }

    if (
      !storySources ||
      storySources.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "This story has no source material attached.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       NORMALISE SOURCE MATERIAL
       ===================================================== */

    const sourceMaterial = (
      await Promise.all(
        storySources.map(async (item) => {
          const newsItem = Array.isArray(
            item.news_item
          )
            ? item.news_item[0] ?? null
            : item.news_item ?? null;

          if (!newsItem) {
            return null;
          }

          const source = Array.isArray(
            newsItem.source
          )
            ? newsItem.source[0] ?? null
            : newsItem.source ?? null;

          try {
            const fetchedArticle = await fetchArticle(
              newsItem.url
            );

            return {
              title:
                fetchedArticle.title ??
                newsItem.title,
              url: newsItem.url,
              excerpt: newsItem.excerpt,
              published_at:
                newsItem.published_at,
              source_name:
                source?.name ?? "Unknown source",
              source_website:
                source?.website ?? null,
              article_text:
                fetchedArticle.text,
            };
          } catch (error) {
            console.error(
              `Source article fetch error for ${newsItem.url}:`,
              error
            );

            return {
              title: newsItem.title,
              url: newsItem.url,
              excerpt: newsItem.excerpt,
              published_at:
                newsItem.published_at,
              source_name:
                source?.name ?? "Unknown source",
              source_website:
                source?.website ?? null,
              article_text: null,
              fetch_error:
                error instanceof Error
                  ? error.message
                  : "Article could not be fetched.",
            };
          }
        })
      )
    ).filter(Boolean);

    const usableSourceMaterial =
      sourceMaterial.filter(
        (item) =>
          item &&
          typeof item.article_text === "string" &&
          item.article_text.length >= 500
      );

    if (sourceMaterial.length === 0) {
      return NextResponse.json(
        {
          error:
            "No usable source material was found.",
        },
        {
          status: 400,
        }
      );
    }

    if (usableSourceMaterial.length === 0) {
      return NextResponse.json(
        {
          error:
            "The linked source article could not be fetched or extracted. Check that the article URL is publicly accessible and try again.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       EDITORIAL PROMPT
       ===================================================== */

    const editorialInstructions = `
You are the editorial drafting engine for NaijaLaughs,
a Nigerian digital news and humour publication.

Your task is to prepare a factual first draft from
the supplied story information and source material.

EDITORIAL RULES:

1. Use only information supported by the supplied
   source material and story information.

2. Do not invent facts, quotations, statistics,
   locations, names, dates or events.

3. Do not present assumptions as facts.

4. If an important point is unclear from the sources,
   acknowledge the uncertainty rather than guessing.

5. Keep the reporting factual and neutral.

6. Do not copy source articles verbatim.

7. Produce an original synthesis of the available
   information.

   8. You can use pidgin English or Nigerian English expressions if they are directly supported by the supplied information, but do not invent them.
    but ensure it is very humorous and funny. If the supplied information does not support humour, do not invent it.

    8. Do not manufacture direct quotations.

9. Do not exaggerate a headline simply to make it
   more clickable.

10. The tone should be clear, accessible and suitable
    for a Nigerian digital audience.

11. Nigerian context may be explained when it is
    directly supported by the supplied information.

12. Humour should NOT be inserted into the factual
    news draft. The humour/cartoon layer will be
    handled separately.

13. If the supplied sources conflict, do not silently
    choose one. Explain the uncertainty in the
    "what_is_not_clear" field.

14. The resulting article must remain suitable for
    human editorial review before publication.

RETURN EXACTLY THIS JSON STRUCTURE:

{
  "headline": "string",
  "standfirst": "string",
  "body": "string",
  "why_it_matters": "string",
  "what_is_not_clear": "string",
  "what_happens_next": "string"
}

BODY FORMAT:

Write the body as normal article prose.

Separate paragraphs with blank lines.

Do not use Markdown headings,
bullet points or HTML.

FIELD GUIDANCE:

headline:
A clear factual headline.

standfirst:
A short summary of the main development.

body:
A complete first-draft news article based only
on the supplied evidence.

why_it_matters:
Explain the significance of the development
using only supported information.

what_is_not_clear:
Identify important uncertainty, missing information
or conflicting information.

what_happens_next:
State only documented or reasonably immediate next
steps supported by the sources. If the sources do
not establish what happens next, say so.
`;

    const storyCategory = Array.isArray(
      story.category
    )
      ? story.category[0] ?? null
      : story.category ?? null;

    const userInput = `
Return the editorial draft as valid JSON using exactly the JSON structure requested in the editorial instructions.

STORY INFORMATION

Title:
${story.title}

Summary:
${story.summary ?? "No summary supplied."}

Region:
${story.region}

Category:
${storyCategory?.name ?? "Uncategorised"}

Status:
${story.status}

Event date:
${story.event_date ?? "Not specified"}


SOURCE MATERIAL

${JSON.stringify(
  sourceMaterial,
  null,
  2
)}
`;

    /* =====================================================
       GENERATE DRAFT
       ===================================================== */

    const response =
      await openai.responses.create({
        model: MODEL,

        instructions:
          editorialInstructions,

        input: userInput,

        text: {
          format: {
            type: "json_object",
          },
        },
      });

    const output =
      response.output_text?.trim();

    if (!output) {
      throw new Error(
        "OpenAI returned an empty response."
      );
    }

    /* =====================================================
       PARSE AI RESPONSE
       ===================================================== */

    let draftContent: {
      headline: string;
      standfirst: string;
      body: string;
      why_it_matters: string;
      what_is_not_clear: string;
      what_happens_next: string;
    };

    try {
      draftContent = JSON.parse(
        output
      );
    } catch (error) {
      console.error(
        "AI JSON parse error:",
        error
      );

      console.error(
        "AI output:",
        output
      );

      throw new Error(
        "The AI returned an invalid draft format."
      );
    }

    /* =====================================================
       VALIDATE REQUIRED FIELDS
       ===================================================== */

    const requiredFields = [
      "headline",
      "standfirst",
      "body",
      "why_it_matters",
      "what_is_not_clear",
      "what_happens_next",
    ] as const;

    for (const field of requiredFields) {
      if (
        typeof draftContent[field] !==
          "string" ||
        !draftContent[field].trim()
      ) {
        throw new Error(
          `AI draft field "${field}" is missing.`
        );
      }
    }

    /* =====================================================
       GET NEXT VERSION
       ===================================================== */

    const {
      data: existingDrafts,
      error: versionsError,
    } = await supabase
      .from("drafts")
      .select("version")
      .eq("story_id", storyId)
      .order("version", {
        ascending: false,
      })
      .limit(1);

    if (versionsError) {
      console.error(
        "Draft version lookup error:",
        versionsError
      );

      throw new Error(
        "Could not determine the next draft version."
      );
    }

    const latestVersion =
      existingDrafts?.[0]?.version ?? 0;

    const nextVersion =
      latestVersion + 1;

    /* =====================================================
       SAVE DRAFT
       ===================================================== */

    const {
      data: savedDraft,
      error: draftError,
    } = await supabase
      .from("drafts")
      .insert({
        story_id: storyId,
        version: nextVersion,
        headline:
          draftContent.headline.trim(),
        standfirst:
          draftContent.standfirst.trim(),
        body:
          draftContent.body.trim(),
        why_it_matters:
          draftContent.why_it_matters.trim(),
        what_is_not_clear:
          draftContent.what_is_not_clear.trim(),
        what_happens_next:
          draftContent.what_happens_next.trim(),
        model: MODEL,
        prompt_version:
          PROMPT_VERSION,
        status: "needs_review",
      })
      .select(`
        id,
        story_id,
        version,
        headline,
        status
      `)
      .single();

    if (draftError || !savedDraft) {
      console.error(
        "Draft insert error:",
        draftError
      );

      throw new Error(
        draftError?.message ??
          "The generated draft could not be saved."
      );
    }

    /* =====================================================
       UPDATE STORY STATUS
       ===================================================== */

    const {
      error: storyUpdateError,
    } = await supabase
      .from("stories")
      .update({
        status: "drafting",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", storyId);

    if (storyUpdateError) {
      console.error(
        "Story status update error:",
        storyUpdateError
      );
    }

    return NextResponse.json({
      success: true,
      draft: savedDraft,
    });
  } catch (error) {
    console.error(
      "Draft generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Draft generation failed.",
      },
      {
        status: 500,
      }
    );
  }
}