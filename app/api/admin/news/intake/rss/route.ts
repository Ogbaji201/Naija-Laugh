import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchRssFeed } from "@/lib/news/rss";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const sourceId = body?.sourceId;

    if (!sourceId) {
      return NextResponse.json(
        {
          success: false,
          error: "sourceId is required.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: source, error: sourceError } = await supabase
      .from("sources")
      .select(
        "id, name, website, rss_url, source_type, region, active"
      )
      .eq("id", sourceId)
      .single();

    if (sourceError) {
      return NextResponse.json(
        {
          success: false,
          error: sourceError.message,
        },
        { status: 500 }
      );
    }

    if (!source) {
      return NextResponse.json(
        {
          success: false,
          error: "Source not found.",
        },
        { status: 404 }
      );
    }

    if (!source.active) {
      return NextResponse.json(
        {
          success: false,
          error: "This source is inactive.",
        },
        { status: 400 }
      );
    }

    if (!source.rss_url) {
      return NextResponse.json(
        {
          success: false,
          error: "This source does not have an RSS feed URL.",
        },
        { status: 400 }
      );
    }

    const feedItems = await fetchRssFeed(source.rss_url);

    if (!feedItems.length) {
      return NextResponse.json({
        success: true,
        source: source.name,
        fetched: 0,
        inserted: 0,
        duplicates: 0,
        message: "The RSS feed returned no usable items.",
      });
    }

    let inserted = 0;
    let duplicates = 0;
    let failed = 0;

    for (const item of feedItems) {
      const { data: existing } = await supabase
        .from("news_items")
        .select("id")
        .eq("url", item.url)
        .maybeSingle();

      if (existing) {
        duplicates++;
        continue;
      }

      const { error: insertError } = await supabase
        .from("news_items")
        .insert({
          source_id: source.id,
          title: item.title,
          url: item.url,
          excerpt: item.excerpt,
          published_at: item.published_at,
          content_hash: item.content_hash,
        });

      if (!insertError) {
        inserted++;
        continue;
      }

      if (insertError.code === "23505") {
        duplicates++;
        continue;
      }

      failed++;

      console.error(
        `Failed to insert RSS item from ${source.name}:`,
        insertError
      );
    }

    return NextResponse.json({
      success: true,
      source: source.name,
      fetched: feedItems.length,
      inserted,
      duplicates,
      failed,
    });
  } catch (error) {
    console.error("RSS ingestion error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected RSS ingestion error occurred.",
      },
      { status: 500 }
    );
  }
} 