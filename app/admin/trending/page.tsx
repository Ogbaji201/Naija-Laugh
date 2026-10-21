
import { Suspense } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import "./trending.css";

type TrendingTopic = {
  id: string;
  topic: string;
  description: string | null;
  image_url: string | null;
  image_alt: string | null;
  article_url: string | null;
  source: string;
  source_url: string | null;
  region: string;
  engagement_data: Record<string, unknown> | null;
  verified: boolean;
  created_at: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getEngagementScore(
  engagementData: Record<string, unknown> | null
) {
  if (!engagementData) return "—";

  const possibleValues = [
    engagementData.score,
    engagementData.engagement,
    engagementData.views,
    engagementData.likes,
  ];

  const value = possibleValues.find(
    (item) => typeof item === "number" || typeof item === "string"
  );

  if (value === undefined) return "Recorded";

  return String(value);
}

async function getTrendingTopics(): Promise<TrendingTopic[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("trending_topics")
    .select(`
      id,
      topic,
      description,
      image_url,
      image_alt,
      article_url,
      source,
      source_url,
      region,
      engagement_data,
      verified,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Unable to load trending topics:", error);
    return [];
  }

  return (data ?? []) as TrendingTopic[];
}

function TrendingLoading() {
  return (
    <main className="admin-main-content">
      <section className="trending-loading">
        <span />
        <h1>Loading Trending</h1>
        <p>Preparing the trending topics workspace...</p>
      </section>
    </main>
  );
}

async function TrendingContent() {
  const topics = await getTrendingTopics();

  const total = topics.length;
  const verified = topics.filter((topic) => topic.verified).length;
  const unverified = topics.filter((topic) => !topic.verified).length;
  const nigeriaTopics = topics.filter(
    (topic) => topic.region.toLowerCase() === "nigeria"
  ).length;

  return (
    <main className="admin-main-content trending-page">
      <section className="trending-page-header">
        <div>
          <span className="admin-section-kicker">TRENDING</span>
          <h2>Trending Topics</h2>
          <p>
            Review trending topics, AI explanations and supporting images
            before approving them for public display.
          </p>
        </div>

        <Link
          href="/admin/trending/new"
          className="admin-accent-button"
        >
          Add Trending Topic
        </Link>
      </section>

      <section className="trending-stats-grid">
        <div className="trending-stat-card">
          <span>Total Topics</span>
          <strong>{total}</strong>
          <small>All recorded topics</small>
        </div>

        <div className="trending-stat-card">
          <span>Verified</span>
          <strong>{verified}</strong>
          <small>Editorially verified</small>
        </div>

        <div className="trending-stat-card">
          <span>Needs Review</span>
          <strong>{unverified}</strong>
          <small>Awaiting verification</small>
        </div>

        <div className="trending-stat-card">
          <span>Nigeria</span>
          <strong>{nigeriaTopics}</strong>
          <small>Nigeria-region topics</small>
        </div>
      </section>

      <section className="trending-workflow">
        <div className="trending-workflow-heading">
          <span>EDITORIAL CONTROL</span>
          <h3>Verify before public display</h3>
          <p>
            Check the explanation and supporting source, then verify
            appropriate topics. Only verified topics appear publicly.
          </p>
        </div>

        <div className="trending-workflow-steps">
          <div>
            <span>01</span>
            <strong>Capture</strong>
            <small>Record a topic and its source.</small>
          </div>

          <div>
            <span>02</span>
            <strong>Review</strong>
            <small>Check the explanation, image and source.</small>
          </div>

          <div>
            <span>03</span>
            <strong>Approve</strong>
            <small>Verify suitable topics for public display.</small>
          </div>
        </div>
      </section>

      <section className="trending-library">
        <div className="trending-library-header">
          <div>
            <span>TOPIC REGISTRY</span>
            <h3>Trending topics</h3>
          </div>

          <span className="trending-count">
            {total} {total === 1 ? "topic" : "topics"}
          </span>
        </div>

        {topics.length === 0 ? (
          <div className="trending-empty">
            <div className="trending-empty-code">TR</div>
            <h3>No trending topics yet</h3>
            <p>
              Run discovery or add your first topic to begin building
              the registry.
            </p>
            <Link
              href="/admin/trending/new"
              className="admin-accent-button"
            >
              Add Trending Topic
            </Link>
          </div>
        ) : (
          <div className="trending-table-wrap">
            <table className="trending-table">
              <thead>
                <tr>
                  <th>Topic and Preview</th>
                  <th>Source</th>
                  <th>Region</th>
                  <th>Engagement</th>
                  <th>Verification</th>
                  <th>Created</th>
                  <th>Manage</th>
                </tr>
              </thead>

              <tbody>
                {topics.map((topic) => (
                  <tr key={topic.id}>
                    <td>
                      <div className="trending-admin-topic">
                        {topic.image_url ? (
                          <img
                            className="trending-admin-thumbnail"
                            src={topic.image_url}
                            alt={
                              topic.image_alt ||
                              `Image related to ${topic.topic}`
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="trending-admin-thumbnail-placeholder">
                            <span>No image</span>
                          </div>
                        )}

                        <div className="trending-admin-topic-content">
                          <strong>{topic.topic}</strong>

                          <p>
                            {topic.description ||
                              "No AI explanation available yet. Review the source or update this topic."}
                          </p>

                          <div className="trending-admin-topic-links">
                            {topic.article_url && (
                              <a
                                href={topic.article_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Read supporting article
                              </a>
                            )}

                            {topic.source_url && (
                              <a
                                href={topic.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View source
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="trending-source">
                        {topic.source}
                      </span>
                    </td>

                    <td>{topic.region}</td>

                    <td>
                      {getEngagementScore(topic.engagement_data)}
                    </td>

                    <td>
                      <span
                        className={
                          topic.verified
                            ? "trending-status verified"
                            : "trending-status pending"
                        }
                      >
                        {topic.verified ? "Verified" : "Needs review"}
                      </span>
                    </td>

                    <td>{formatDate(topic.created_at)}</td>

                    <td>
                      <Link
                        href={`/admin/trending/${topic.id}`}
                        className="trending-manage-link"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default function TrendingAdminPage() {
  return (
    <Suspense fallback={<TrendingLoading />}>
      <TrendingContent />
    </Suspense>
  );
}
