
import { Suspense } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import "./trending.css";

type TrendingItem = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  articleUrl: string | null;
  views: string;
  rank: number;
  source: string;
  sourceUrl: string | null;
  region: string;
};

const navigation = [
  ["Home", "/"],
  ["Nigeria", "/category/nigeria"],
  ["Africa", "/category/africa"],
  ["World", "/category/world"],
  ["Business", "/category/business"],
  ["Sports", "/category/sports"],
  ["Entertainment", "/category/entertainment"],
  ["Tech", "/category/tech"],
  ["Funny", "/category/funny"],
  ["Explainers", "/category/explainers"],
];

function getEngagementValue(
  data: Record<string, unknown> | null
): string {
  if (!data) return "—";

  const value = data.score ?? data.engagement ?? data.views ?? data.likes;

  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "number") return value.toLocaleString("en-GB");

  return String(value);
}

async function getTrendingTopics(): Promise<TrendingItem[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("trending_topics")
    .select(
      "id, topic, description, image_url, image_alt, article_url, source, source_url, region, engagement_data, verified, created_at"
    )
    .eq("verified", true)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Trending topics fetch error:", error);
    throw new Error("Unable to load trending topics.");
  }

  return (data ?? []).map((row, index) => ({
    id: row.id,
    title: row.topic,
    description: row.description,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    articleUrl: row.article_url,
    views: getEngagementValue(
      row.engagement_data as Record<string, unknown> | null
    ),
    rank: index + 1,
    source: row.source,
    sourceUrl: row.source_url,
    region: row.region,
  }));
}

async function TrendingContent() {
  const items = await getTrendingTopics();

  return (
    <main className="trending-page">
      <header className="trending-site-header">
        <div className="trending-header-inner">
          <Link href="/" className="trending-logo">
            Naija<span>Laughs</span>
          </Link>

          <nav className="trending-nav" aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <Link key={href} href={href}>
                {label}
              </Link>
            ))}
            <Link href="/trending" className="active">
              🔥 Trending
            </Link>
          </nav>
        </div>
      </header>

      <section className="trending-hero">
        <div className="trending-hero-inner">
          <span className="trending-kicker">
            WHAT NIGERIANS ARE TALKING ABOUT
          </span>
          <h1>
            Trending <span>Now.</span>
          </h1>
          <p>
            The stories, conversations and moments getting Nigerians talking
            right now.
          </p>
        </div>
      </section>

      <section className="trending-content">
        <div className="trending-heading">
          <div>
            <span>TOP STORIES</span>
            <h2>What&apos;s Trending</h2>
          </div>
          <Link href="/">← Back to Home</Link>
        </div>

        {items.length === 0 ? (
          <div className="trending-public-empty">
            <span>TR</span>
            <h3>No verified trends yet</h3>
            <p>
              We&apos;re checking the conversations and stories gaining
              attention. Verified topics will appear here.
            </p>
          </div>
        ) : (
          <div className="trending-list">
            {items.map((item, index) => (
              <article className="trending-row" key={item.id}>
                <div className="trending-rank">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="trending-thumbnail">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.imageAlt || `Image related to ${item.title}`}
                      loading={index < 2 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div className="trending-thumbnail-placeholder">
                      <span>NL</span>
                    </div>
                  )}
                </div>

                <div className="trending-story">
                  <span className="trending-story-label">
                    {item.region.toUpperCase()} · TRENDING
                  </span>

                  <h3>
                    {item.articleUrl ? (
                      <a
                        href={item.articleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </h3>

                  <p className="trending-description">
                    {item.description ||
                      "More details about this trending topic are being reviewed. Check back for an update."}
                  </p>

                  <div className="trending-source">
                    {item.sourceUrl ? (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Source: {item.source}
                      </a>
                    ) : (
                      <span>Source: {item.source}</span>
                    )}
                  </div>
                </div>

                <div className="trending-views">
                  <strong>{item.views}</strong>
                  <small>engagement</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function TrendingLoading() {
  return (
    <main className="trending-page">
      <div className="trending-loading">
        <span />
        <div />
        <div />
        <div />
      </div>
    </main>
  );
}

export default function TrendingPage() {
  return (
    <Suspense fallback={<TrendingLoading />}>
      <TrendingContent />
    </Suspense>
  );
}
