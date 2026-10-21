import crypto from "crypto";

export type RssFeedItem = {
  title: string;
  url: string;
  excerpt: string | null;
  published_at: string | null;
  content_hash: string;
};

function getTagValue(xml: string, tagName: string): string | null {
  const regex = new RegExp(
    `<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</${tagName}>`,
    "i"
  );

  const match = xml.match(regex);

  if (!match?.[1]) {
    return null;
  }

  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function getLink(itemXml: string): string | null {
  // Standard RSS:
  // <link>https://www.premiumtimesng.com/feed</link>
  const standardLink = getTagValue(itemXml, "link");

  if (standardLink && /^https?:\/\//i.test(standardLink)) {
    return standardLink;
  }

  // Atom feeds:
  // <link href="https://www.premiumtimesng.com/feed" />
  const atomMatch = itemXml.match(
    /<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i
  );

  if (atomMatch?.[1]) {
    return atomMatch[1].trim();
  }

  return null;
}

function getFeedItems(xml: string): string[] {
  // RSS 2.0
  const rssItems = [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)];

  if (rssItems.length > 0) {
    return rssItems.map((match) => match[1]);
  }

  // Atom
  const atomEntries = [
    ...xml.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi),
  ];

  return atomEntries.map((match) => match[1]);
}

export async function fetchRssFeed(
  rssUrl: string
): Promise<RssFeedItem[]> {
  if (!rssUrl) {
    throw new Error("RSS URL is required.");
  }

  let response: Response;

  try {
    response = await fetch(rssUrl, {
      headers: {
        Accept:
          "application/rss+xml, application/atom+xml, application/xml, text/xml",
        "User-Agent": "NaijaLaughs-NewsBot/1.0",
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      `Unable to connect to RSS feed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  if (!response.ok) {
    throw new Error(
      `RSS feed returned HTTP ${response.status} ${response.statusText}.`
    );
  }

  const xml = await response.text();

  if (!xml.trim()) {
    throw new Error("RSS feed returned an empty response.");
  }

  const itemXmls = getFeedItems(xml);

  const items: RssFeedItem[] = [];

  for (const itemXml of itemXmls) {
    const title = getTagValue(itemXml, "title");
    const url = getLink(itemXml);

    if (!title || !url) {
      continue;
    }

    const excerpt =
      getTagValue(itemXml, "description") ||
      getTagValue(itemXml, "summary") ||
      getTagValue(itemXml, "content");

    const publishedRaw =
      getTagValue(itemXml, "pubDate") ||
      getTagValue(itemXml, "published") ||
      getTagValue(itemXml, "updated");

    let published_at: string | null = null;

    if (publishedRaw) {
      const parsedDate = new Date(publishedRaw);

      if (!Number.isNaN(parsedDate.getTime())) {
        published_at = parsedDate.toISOString();
      }
    }

    const contentForHash = [
      title.trim(),
      url.trim(),
      excerpt?.trim() || "",
      published_at || "",
    ].join("|");

    const content_hash = crypto
      .createHash("sha256")
      .update(contentForHash)
      .digest("hex");

    items.push({
      title: title.trim(),
      url: url.trim(),
      excerpt: excerpt?.trim() || null,
      published_at,
      content_hash,
    });
  }

  return items;
}