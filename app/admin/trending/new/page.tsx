import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import "../trending.css";

async function createTrendingTopic(formData: FormData) {
  "use server";

  const topic = String(formData.get("topic") || "").trim();
  const source = String(formData.get("source") || "").trim();
  const sourceUrl = String(formData.get("source_url") || "").trim();
  const region = String(formData.get("region") || "Nigeria").trim();
  const engagement = String(formData.get("engagement") || "").trim();
  const verified = formData.get("verified") === "on";

  if (!topic) {
    throw new Error("Topic is required.");
  }

  if (!source) {
    throw new Error("Source is required.");
  }

  let engagementData: Record<string, unknown> | null = null;

  if (engagement) {
    engagementData = {
      score: engagement,
    };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("trending_topics")
    .insert({
      topic,
      source,
      source_url: sourceUrl || null,
      region: region || "Nigeria",
      engagement_data: engagementData,
      verified,
    });

  if (error) {
    console.error("Unable to create trending topic:", error);
    throw new Error(error.message);
  }

  redirect("/admin/trending");
}

function TrendingCreateLoading() {
  return (
    <main className="admin-main-content">
      <section className="trending-loading">
        <span />
        <h1>Loading Trending Topic</h1>
        <p>
          Preparing the trending topic editor...
        </p>
      </section>
    </main>
  );
}

function TrendingCreateContent() {
  return (
    <main className="admin-main-content trending-page">
      <section className="trending-page-header">
        <div>
          <span className="admin-section-kicker">
            TRENDING / NEW TOPIC
          </span>

          <h2>Add Trending Topic</h2>

          <p>
            Capture a topic that is gaining attention and record
            the source for editorial verification.
          </p>
        </div>

        <Link
          href="/admin/trending"
          className="admin-outline-button"
        >
          Back to Trending
        </Link>
      </section>

      <form action={createTrendingTopic}>
        <section className="trending-form-panel">
          {/* =====================================================
              TOPIC INFORMATION
              ===================================================== */}

          <div className="trending-form-section">
            <div className="trending-form-section-heading">
              <span>01</span>

              <div>
                <h3>Topic Information</h3>

                <p>
                  Enter the topic exactly as it should appear in
                  the newsroom.
                </p>
              </div>
            </div>

            <div className="trending-form-grid">
              <div className="trending-field trending-field-full">
                <label htmlFor="topic">
                  Topic <span>*</span>
                </label>

                <input
                  id="topic"
                  name="topic"
                  type="text"
                  placeholder="e.g. Fuel price changes"
                  required
                />

                <small>
                  Keep the topic concise and clear.
                </small>
              </div>

              <div className="trending-field">
                <label htmlFor="region">
                  Region
                </label>

                <select
                  id="region"
                  name="region"
                  defaultValue="Nigeria"
                >
                  <option value="Nigeria">
                    Nigeria
                  </option>

                  <option value="Africa">
                    Africa
                  </option>

                  <option value="World">
                    World
                  </option>
                </select>
              </div>

              <div className="trending-field">
                <label htmlFor="engagement">
                  Engagement Score
                </label>

                <input
                  id="engagement"
                  name="engagement"
                  type="text"
                  placeholder="e.g. 8420"
                />

                <small>
                  Optional. Used to record the available
                  engagement signal.
                </small>
              </div>
            </div>
          </div>

          {/* =====================================================
              SOURCE
              ===================================================== */}

          <div className="trending-form-section">
            <div className="trending-form-section-heading">
              <span>02</span>

              <div>
                <h3>Source</h3>

                <p>
                  Record where the trending topic was identified.
                </p>
              </div>
            </div>

            <div className="trending-form-grid">
              <div className="trending-field">
                <label htmlFor="source">
                  Source <span>*</span>
                </label>

                <input
                  id="source"
                  name="source"
                  type="text"
                  placeholder="e.g. X, Google Trends, BBC"
                  required
                />
              </div>

              <div className="trending-field">
                <label htmlFor="source_url">
                  Source URL
                </label>

                <input
                  id="source_url"
                  name="source_url"
                  type="url"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* =====================================================
              VERIFICATION
              ===================================================== */}

          <div className="trending-form-section">
            <div className="trending-form-section-heading">
              <span>03</span>

              <div>
                <h3>Editorial Verification</h3>

                <p>
                  Verified topics can be treated as editorially
                  confirmed trending subjects.
                </p>
              </div>
            </div>

            <label className="trending-checkbox-row">
              <input
                type="checkbox"
                name="verified"
              />

              <span className="trending-checkbox-content">
                <strong>
                  Mark as verified
                </strong>

                <small>
                  Leave unchecked if the topic still needs
                  editorial verification.
                </small>
              </span>
            </label>
          </div>

          {/* =====================================================
              ACTIONS
              ===================================================== */}

          <div className="trending-form-actions">
            <Link
              href="/admin/trending"
              className="admin-outline-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="admin-accent-button"
            >
              Add Trending Topic
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}

export default function NewTrendingTopicPage() {
  return (
    <Suspense fallback={<TrendingCreateLoading />}>
      <TrendingCreateContent />
    </Suspense>
  );
}