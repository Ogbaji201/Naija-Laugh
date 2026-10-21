import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import GenerateDraftButton from "./GenerateDraftButton";

type Story = {
  id: string;
  title: string;
  summary: string | null;
  region: string;
  status: string;
  event_date: string | null;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type NewsItem = {
  id: string;
  title: string;
  url: string;
  excerpt: string | null;
  published_at: string | null;
  fetched_at: string;
  source: {
    id: string;
    name: string;
    website: string | null;
  } | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

async function attachNewsItem(formData: FormData) {
  "use server";

  const storyId = String(formData.get("story_id") || "");
  const newsItemId = String(formData.get("news_item_id") || "");

  if (!storyId || !newsItemId) {
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("story_sources")
    .insert({
      story_id: storyId,
      news_item_id: newsItemId,
    });

  if (error && error.code !== "23505") {
    console.error("Attach news item error:", error);
  }

  redirect(`/admin/news/stories/${storyId}`);
}

async function removeNewsItem(formData: FormData) {
  "use server";

  const storyId = String(formData.get("story_id") || "");
  const newsItemId = String(formData.get("news_item_id") || "");

  if (!storyId || !newsItemId) {
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("story_sources")
    .delete()
    .eq("story_id", storyId)
    .eq("news_item_id", newsItemId);

  if (error) {
    console.error("Remove news item error:", error);
  }

  redirect(`/admin/news/stories/${storyId}`);
}

async function StoryDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = createAdminClient();

  const { data: story, error: storyError } = await supabase
    .from("stories")
    .select(
      `
        id,
        title,
        summary,
        region,
        status,
        event_date,
        created_at,
        updated_at,
        category:categories (
          id,
          name,
          slug
        )
      `
    )
    .eq("id", id)
    .single();

  if (storyError || !story) {
    return (
      <main className="admin-main-content">
        <section className="sources-empty">
          <h1>Story not found</h1>
          <p>
            The requested newsroom story could not be found.
          </p>
          <Link
            href="/admin/news/stories"
            className="admin-outline-button"
          >
            Back to Stories
          </Link>
        </section>
      </main>
    );
  }

  const { data: storySources, error: storySourcesError } =
    await supabase
      .from("story_sources")
      .select(
        `
          story_id,
          news_item_id,
          news_item:news_items (
            id,
            title,
            url,
            excerpt,
            published_at,
            fetched_at,
            source:sources (
              id,
              name,
              website
            )
          )
        `
      )
      .eq("story_id", id)
      .order("created_at", {
        ascending: false,
      });

  if (storySourcesError) {
    console.error(
      "Load story sources error:",
      storySourcesError
    );
  }

  const attachedNews: NewsItem[] = (
    storySources ?? []
  )
    .map((item) => {
      const rawNewsItem = Array.isArray(item.news_item)
        ? item.news_item[0] ?? null
        : item.news_item ?? null;

      if (!rawNewsItem) {
        return null;
      }

      return {
        ...rawNewsItem,
        source: Array.isArray(rawNewsItem.source)
          ? rawNewsItem.source[0] ?? null
          : rawNewsItem.source ?? null,
      };
    })
    .filter(Boolean) as NewsItem[];

  const attachedIds = attachedNews.map(
    (item) => item.id
  );

  const { data: availableNews } = await supabase
    .from("news_items")
    .select(
      `
        id,
        title,
        url,
        excerpt,
        published_at,
        fetched_at,
        source:sources (
          id,
          name,
          website
        )
      `
    )
    .order("fetched_at", {
      ascending: false,
    })
    .limit(50);

  const availableItems: NewsItem[] = (
    availableNews ?? []
  )
    .map((item) => ({
      ...item,
      source: Array.isArray(item.source)
        ? item.source[0] ?? null
        : item.source ?? null,
    }))
    .filter((item) => !attachedIds.includes(item.id)) as NewsItem[];

  const normalizedStory: Story = {
    ...story,
    category: Array.isArray(story.category)
      ? story.category[0] ?? null
      : story.category ?? null,
  };

  return (
    <main className="admin-main-content">
      <section className="sources-page">
        <div className="sources-page-header">
          <div>
            <Link
              href="/admin/news/stories"
              className="admin-back-link"
            >
              ← Back to Stories
            </Link>

            <h1>{normalizedStory.title}</h1>

            <p>
              Manage the story, attach source material and
              prepare it for editorial drafting.
            </p>
          </div>

          <div className="sources-page-header-actions">
            <span className="source-status">
              {statusLabel(normalizedStory.status)}
            </span>
          </div>
        </div>

        <div className="sources-summary">
          <div className="sources-summary-card">
            <span className="sources-summary-label">
              Region
            </span>
            <strong>{normalizedStory.region}</strong>
          </div>

          <div className="sources-summary-card">
            <span className="sources-summary-label">
              Category
            </span>
            <strong>
              {normalizedStory.category?.name ||
                "Uncategorised"}
            </strong>
          </div>

          <div className="sources-summary-card">
            <span className="sources-summary-label">
              Sources
            </span>
            <strong>{attachedNews.length}</strong>
          </div>

          <div className="sources-summary-card">
            <span className="sources-summary-label">
              Updated
            </span>
            <strong>
              {formatDate(normalizedStory.updated_at)}
            </strong>
          </div>
        </div>

        <div className="sources-layout">
          <div className="sources-panel">
            <div className="sources-panel-header">
              <div>
                <span className="sources-panel-label">
                  Story Overview
                </span>
                <h2>Editorial Context</h2>
              </div>
            </div>

            <div className="sources-form">
              <div className="sources-field">
                <label>Story title</label>
                <div className="sources-readonly-value">
                  {normalizedStory.title}
                </div>
              </div>

              <div className="sources-field">
                <label>Summary</label>
                <div className="sources-readonly-value">
                  {normalizedStory.summary ||
                    "No summary has been added yet."}
                </div>
              </div>

              <div className="sources-field">
                <label>Event date</label>
                <div className="sources-readonly-value">
                  {formatDate(normalizedStory.event_date)}
                </div>
              </div>

              <div className="sources-field">
                <label>Created</label>
                <div className="sources-readonly-value">
                  {formatDate(normalizedStory.created_at)}
                </div>
              </div>
            </div>
          </div>

          <div className="sources-panel">
            <div className="sources-panel-header">
              <div>
                <span className="sources-panel-label">
                  Source Material
                </span>
                <h2>Attached News Items</h2>
              </div>

              <span className="sources-list-count">
                {attachedNews.length} attached
              </span>
            </div>

            {attachedNews.length === 0 ? (
              <div className="sources-empty">
                <h3>No source material attached</h3>
                <p>
                  Attach at least one news item before
                  generating an AI draft.
                </p>
              </div>
            ) : (
              <div className="sources-list">
                {attachedNews.map((item) => (
                  <article
                    key={item.id}
                    className="source-item"
                  >
                    <div className="source-item-main">
                      <div className="source-item-heading">
                        <h3>{item.title}</h3>

                        <span className="source-status">
                          Attached
                        </span>
                      </div>

                      <div className="source-item-meta">
                        <span>
                          {item.source?.name ||
                            "Unknown source"}
                        </span>

                        <span>
                          Published{" "}
                          {formatDate(item.published_at)}
                        </span>
                      </div>

                      {item.excerpt && (
                        <p>{item.excerpt}</p>
                      )}

                      <div className="source-item-links">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open source
                        </a>

                        <form
                          action={removeNewsItem}
                        >
                          <input
                            type="hidden"
                            name="story_id"
                            value={normalizedStory.id}
                          />

                          <input
                            type="hidden"
                            name="news_item_id"
                            value={item.id}
                          />

                          <button
                            type="submit"
                            className="admin-text-button"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sources-panel">
          <div className="sources-panel-header">
            <div>
              <span className="sources-panel-label">
                Add Source Material
              </span>
              <h2>Available News Items</h2>
            </div>

            <span className="sources-list-count">
              {availableItems.length} available
            </span>
          </div>

          {availableItems.length === 0 ? (
            <div className="sources-empty">
              <h3>No additional news items</h3>
              <p>
                All available news items are already
                attached to this story.
              </p>
            </div>
          ) : (
            <div className="sources-list">
              {availableItems.map((item) => (
                <article
                  key={item.id}
                  className="source-item"
                >
                  <div className="source-item-main">
                    <div className="source-item-heading">
                      <h3>{item.title}</h3>
                    </div>

                    <div className="source-item-meta">
                      <span>
                        {item.source?.name ||
                          "Unknown source"}
                      </span>

                      <span>
                        Published{" "}
                        {formatDate(item.published_at)}
                      </span>
                    </div>

                    {item.excerpt && (
                      <p>{item.excerpt}</p>
                    )}

                    <div className="source-item-links">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open source
                      </a>

                      <form action={attachNewsItem}>
                        <input
                          type="hidden"
                          name="story_id"
                          value={normalizedStory.id}
                        />

                        <input
                          type="hidden"
                          name="news_item_id"
                          value={item.id}
                        />

                        <button
                          type="submit"
                          className="admin-outline-button"
                        >
                          Attach to Story
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="sources-panel">
          <div className="sources-panel-header">
            <div>
              <span className="sources-panel-label">
                AI Draft Preparation
              </span>
              <h2>Generate Editorial Draft</h2>
            </div>
          </div>

          <div className="sources-form">
            <div className="sources-field">
              <label>Draft readiness</label>

              <div className="sources-readonly-value">
                {attachedNews.length > 0
                  ? "Source material is attached and ready for AI drafting."
                  : "Attach at least one source before generating a draft."}
              </div>
            </div>

            <div className="sources-form-footer">
              <GenerateDraftButton
                storyId={normalizedStory.id}
                disabled={attachedNews.length === 0}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StoryDetailLoading() {
  return (
    <main className="admin-main-content">
      <section className="sources-loading">
        <span />
        <h1>Loading story</h1>
        <p>
          Retrieving story details and source material...
        </p>
      </section>
    </main>
  );
}

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<StoryDetailLoading />}>
      <StoryDetailContent params={params} />
    </Suspense>
  );
}