import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import FetchRssButton from "./FetchRssButton";

type Source = {
  id: string;
  name: string;
  website: string | null;
  source_type: string;
  region: string;
  active: boolean;
  rss_url: string | null;
};

type NewsItem = {
  id: string;
  created_at: string;
  title: string;
  url: string;
  excerpt: string | null;
  published_at: string | null;
  fetched_at: string;
  source_id: string;
  source: {
    name: string;
  } | null;
};

function formatDate(date: string | null) {
  if (!date) {
    return "No date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsedDate);
}

async function addNewsItem(formData: FormData) {
  "use server";

  const sourceId = String(
    formData.get("source_id") || ""
  ).trim();

  const title = String(
    formData.get("title") || ""
  ).trim();

  const url = String(
    formData.get("url") || ""
  ).trim();

  const excerpt = String(
    formData.get("excerpt") || ""
  ).trim();

  const publishedAt = String(
    formData.get("published_at") || ""
  ).trim();

  if (!sourceId || !title || !url) {
    throw new Error(
      "Source, headline and URL are required."
    );
  }

  const supabase = createAdminClient();

  const {
    data: source,
    error: sourceError,
  } = await supabase
    .from("sources")
    .select("id")
    .eq("id", sourceId)
    .eq("active", true)
    .single();

  if (sourceError || !source) {
    throw new Error(
      "The selected source is invalid or inactive."
    );
  }

  const { error } = await supabase
    .from("news_items")
    .insert({
      source_id: sourceId,
      title,
      url,
      excerpt: excerpt || null,
      published_at: publishedAt
        ? new Date(publishedAt).toISOString()
        : null,
      fetched_at: new Date().toISOString(),
    });

  if (error) {
    console.error(
      "News item insert error:",
      error
    );

    throw new Error(error.message);
  }

  redirect("/admin/news/intake");
}

async function NewsIntakeContent() {
  const supabase = createAdminClient();

  const [
    { data: sources, error: sourcesError },
    { data: newsItems, error: newsError },
  ] = await Promise.all([
    supabase
      .from("sources")
      .select(
        "id, name, website, source_type, region, active, rss_url"
      )
      .eq("active", true)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("news_items")
      .select(`
        id,
        created_at,
        title,
        url,
        excerpt,
        published_at,
        fetched_at,
        source_id,
        source:sources (
          name
        )
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(20),
  ]);

  if (sourcesError) {
    console.error(
      "Sources fetch error:",
      sourcesError
    );
  }

  if (newsError) {
    console.error(
      "News items fetch error:",
      newsError
    );
  }

  const activeSources: Source[] =
    sources ?? [];

  const rssSources = activeSources
  .filter((source) => Boolean(source.rss_url))
  .map((source) => ({
    id: source.id,
    name: source.name,
  }));

  const recentNews: NewsItem[] = (
    newsItems ?? []
  ).map((item) => ({
    id: item.id,
    created_at: item.created_at,
    title: item.title,
    url: item.url,
    excerpt: item.excerpt,
    published_at: item.published_at,
    fetched_at: item.fetched_at,
    source_id: item.source_id,
    source: Array.isArray(item.source)
      ? item.source[0] ?? null
      : item.source ?? null,
  }));

  return (
    <div className="news-intake-page">
      <div className="news-intake-header">
        <div>
          <span className="admin-breadcrumb">
            NEWSROOM / INTAKE
          </span>

          <h2>
            News Intake
          </h2>

          <p>
            Capture original source stories before
            they move through the AI editorial pipeline.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {rssSources.length > 0 && (
            <FetchRssButton
              sources={rssSources}
            />
          )}

          <Link
            href="/admin/news?status=needs_review"
            className="admin-outline-button"
          >
            ← News Review
          </Link>
        </div>
      </div>

      <div className="news-intake-grid">
        <section className="news-intake-panel">
          <div className="news-intake-panel-header">
            <div>
              <span className="news-intake-panel-label">
                SOURCE CAPTURE
              </span>

              <h3>
                Add News Item
              </h3>

              <p>
                Record the original source information.
                Nothing is published from this form.
              </p>
            </div>
          </div>

          <form
            action={addNewsItem}
            className="news-intake-form"
          >
            <div className="news-intake-field">
              <label htmlFor="source_id">
                Source
              </label>

              <select
                id="source_id"
                name="source_id"
                required
                defaultValue=""
              >
                <option
                  value=""
                  disabled
                >
                  Select a source
                </option>

                {activeSources.map(
                  (source) => (
                    <option
                      key={source.id}
                      value={source.id}
                    >
                      {source.name} —{" "}
                      {source.region}
                    </option>
                  )
                )}
              </select>

              {activeSources.length === 0 && (
                <small>
                  No active sources exist yet.
                  Add a source before using
                  the intake form.
                </small>
              )}
            </div>

            <div className="news-intake-field">
              <label htmlFor="title">
                Original Headline
              </label>

              <input
                id="title"
                name="title"
                type="text"
                placeholder="Enter the original source headline"
                required
              />
            </div>

            <div className="news-intake-field">
              <label htmlFor="url">
                Original Article URL
              </label>

              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com/article"
                required
              />
            </div>

            <div className="news-intake-field">
              <label htmlFor="published_at">
                Published Date
              </label>

              <input
                id="published_at"
                name="published_at"
                type="datetime-local"
              />
            </div>

            <div className="news-intake-field">
              <label htmlFor="excerpt">
                Source Description
              </label>

              <textarea
                id="excerpt"
                name="excerpt"
                rows={5}
                placeholder="Add a short description or source excerpt..."
              />
            </div>

            <div className="news-intake-form-footer">
              <span>
                Source information only.
                AI processing happens next.
              </span>

              <button
                type="submit"
                className="admin-accent-button"
              >
                Save News Item
              </button>
            </div>
          </form>
        </section>

        <section className="news-intake-panel">
          <div className="news-intake-panel-header">
            <div>
              <span className="news-intake-panel-label">
                INTAKE QUEUE
              </span>

              <h3>
                Recent Intake
              </h3>

              <p>
                The latest stories captured by
                the newsroom.
              </p>
            </div>

            <span className="news-intake-count">
              {recentNews.length}
            </span>
          </div>

          {recentNews.length === 0 ? (
            <div className="news-intake-empty">
              <span>
                00
              </span>

              <h3>
                No news items yet
              </h3>

              <p>
                Source stories added to the newsroom
                will appear here.
              </p>
            </div>
          ) : (
            <div className="news-intake-list">
              {recentNews.map(
                (item) => (
                  <article
                    key={item.id}
                    className="news-intake-item"
                  >
                    <div className="news-intake-item-meta">
                      <span>
                        {item.source?.name ||
                          "Unknown source"}
                      </span>

                      <time
                        dateTime={
                          item.created_at
                        }
                      >
                        {formatDate(
                          item.created_at
                        )}
                      </time>
                    </div>

                    <h3>
                      {item.title}
                    </h3>

                    {item.excerpt && (
                      <p>
                        {item.excerpt}
                      </p>
                    )}

                    <div className="news-intake-item-footer">
                      <span>
                        Published{" "}
                        {formatDate(
                          item.published_at
                        )}
                      </span>

                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Source →
                      </a>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function NewsIntakeLoading() {
  return (
    <section className="news-loading">
      <span />

      <h1>
        Loading newsroom intake
      </h1>

      <p>
        Retrieving the latest source stories...
      </p>
    </section>
  );
}

export default function NewsIntakePage() {
  return (
    <Suspense
      fallback={
        <NewsIntakeLoading />
      }
    >
      <NewsIntakeContent />
    </Suspense>
  );
}