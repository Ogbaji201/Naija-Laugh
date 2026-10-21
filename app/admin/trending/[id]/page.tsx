
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import "../trending.css";

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

function getEngagementValue(
  data: Record<string, unknown> | null
) {
  if (!data) return "";

  const value =
    data.score ?? data.engagement ?? data.views ?? data.likes;

  return value === undefined || value === null ? "" : String(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

async function updateTrendingTopic(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "").trim();
  const topic = String(formData.get("topic") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim();
  const imageAlt = String(formData.get("image_alt") || "").trim();
  const articleUrl = String(formData.get("article_url") || "").trim();
  const source = String(formData.get("source") || "").trim();
  const sourceUrl = String(formData.get("source_url") || "").trim();
  const region = String(formData.get("region") || "Nigeria").trim();
  const engagement = String(formData.get("engagement") || "").trim();
  const verified = formData.get("verified") === "on";

  if (!id || !topic || !source) {
    throw new Error("Topic and source are required.");
  }

  function validateOptionalUrl(value: string, label: string) {
    if (!value) return null;

    try {
      const url = new URL(value);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error();
      }

      return url.toString();
    } catch {
      throw new Error(`${label} must be a valid HTTP or HTTPS URL.`);
    }
  }

  const safeImageUrl = validateOptionalUrl(imageUrl, "Image URL");
  const safeArticleUrl = validateOptionalUrl(articleUrl, "Article URL");
  const safeSourceUrl = validateOptionalUrl(sourceUrl, "Source URL");

  let engagementData: Record<string, unknown> | null = null;

  if (engagement) {
    const numericValue = Number(engagement);

    engagementData = {
      score: Number.isFinite(numericValue) ? numericValue : engagement,
    };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("trending_topics")
    .update({
      topic,
      description: description || null,
      image_url: safeImageUrl,
      image_alt: imageAlt || null,
      article_url: safeArticleUrl,
      source,
      source_url: safeSourceUrl,
      region,
      engagement_data: engagementData,
      verified,
    })
    .eq("id", id);

  if (error) {
    console.error("Unable to update trending topic:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/trending");
  revalidatePath(`/admin/trending/${id}`);
  revalidatePath("/trending");
  revalidatePath("/");

  redirect("/admin/trending");
}

async function deleteTrendingTopic(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("Topic ID is required.");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("trending_topics")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Unable to delete trending topic:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/trending");
  revalidatePath("/trending");
  revalidatePath("/");

  redirect("/admin/trending");
}

function TrendingManagementLoading() {
  return (
    <main className="admin-main-content trending-page">
      <section className="trending-loading">
        <span />
        <h1>Loading Trending Topic</h1>
        <p>Preparing topic management...</p>
      </section>
    </main>
  );
}

async function TrendingManagementContent({ id }: { id: string }) {
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
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load trending topic:", error);
    throw new Error("Unable to load this trending topic.");
  }

  if (!data) notFound();

  const topic = data as TrendingTopic;

  return (
    <main className="admin-main-content trending-page">
      <section className="trending-page-header">
        <div>
          <span className="admin-section-kicker">
            TRENDING / MANAGE TOPIC
          </span>
          <h2>Manage Trending Topic</h2>
          <p>
            Edit the explanation, image and source information before
            approving this topic for public display.
          </p>
        </div>

        <Link href="/admin/trending" className="admin-outline-button">
          Back to Trending
        </Link>
      </section>

      <section className="trending-management-summary">
        <div>
          <span className="trending-management-label">CURRENT TOPIC</span>
          <strong>{topic.topic}</strong>
          <small>Created {formatDate(topic.created_at)}</small>
        </div>

        <span
          className={
            topic.verified
              ? "trending-status verified"
              : "trending-status pending"
          }
        >
          {topic.verified ? "Verified" : "Needs review"}
        </span>
      </section>

      <form action={updateTrendingTopic}>
        <input type="hidden" name="id" value={topic.id} />

        <section className="trending-form-panel">
          <div className="trending-form-section">
            <div className="trending-form-section-heading">
              <span>01</span>
              <div>
                <h3>Topic Information</h3>
                <p>Edit the headline and AI-generated explanation.</p>
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
                  defaultValue={topic.topic}
                  required
                />
              </div>

              <div className="trending-field trending-field-full">
                <label htmlFor="description">Trend Explanation</label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={topic.description ?? ""}
                  rows={5}
                  placeholder="Explain what happened and why people are talking about it."
                />
                <small>
                  Check the facts and edit the explanation before approving.
                </small>
              </div>

              <div className="trending-field">
                <label htmlFor="region">Region</label>
                <select
                  id="region"
                  name="region"
                  defaultValue={topic.region}
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="Africa">Africa</option>
                  <option value="World">World</option>
                </select>
              </div>

              <div className="trending-field">
                <label htmlFor="engagement">Engagement Score</label>
                <input
                  id="engagement"
                  name="engagement"
                  type="text"
                  defaultValue={getEngagementValue(topic.engagement_data)}
                  placeholder="e.g. 2500"
                />
              </div>
            </div>
          </div>

          <div className="trending-form-section">
            <div className="trending-form-section-heading">
              <span>02</span>
              <div>
                <h3>Image and Article</h3>
                <p>Manage the thumbnail and supporting story.</p>
              </div>
            </div>

            {topic.image_url && (
              <div className="trending-edit-image-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={topic.image_url}
                  alt={topic.image_alt || `Image related to ${topic.topic}`}
                />
                <span>Current thumbnail</span>
              </div>
            )}

            <div className="trending-form-grid">
              <div className="trending-field trending-field-full">
                <label htmlFor="image_url">Image URL</label>
                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  defaultValue={topic.image_url ?? ""}
                  placeholder="https://..."
                />
              </div>

              <div className="trending-field trending-field-full">
                <label htmlFor="image_alt">Image Description (Alt Text)</label>
                <input
                  id="image_alt"
                  name="image_alt"
                  type="text"
                  defaultValue={topic.image_alt ?? ""}
                  placeholder="Describe the image briefly"
                />
              </div>

              <div className="trending-field trending-field-full">
                <label htmlFor="article_url">Supporting Article URL</label>
                <input
                  id="article_url"
                  name="article_url"
                  type="url"
                  defaultValue={topic.article_url ?? ""}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="trending-form-section">
            <div className="trending-form-section-heading">
              <span>03</span>
              <div>
                <h3>Source Information</h3>
                <p>Keep the source name and reference link accurate.</p>
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
                  defaultValue={topic.source}
                  required
                />
              </div>

              <div className="trending-field">
                <label htmlFor="source_url">Source URL</label>
                <input
                  id="source_url"
                  name="source_url"
                  type="url"
                  defaultValue={topic.source_url ?? ""}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="trending-form-section">
            <div className="trending-form-section-heading">
              <span>04</span>
              <div>
                <h3>Editorial Verification</h3>
                <p>
                  Verify the story, source and explanation before making it
                  public.
                </p>
              </div>
            </div>

            <label className="trending-checkbox-row">
              <input
                type="checkbox"
                name="verified"
                defaultChecked={topic.verified}
              />
              <span className="trending-checkbox-content">
                <strong>Mark as verified</strong>
                <small>
                  When unchecked, the topic will not appear on the public
                  Trending page.
                </small>
              </span>
            </label>
          </div>

          <div className="trending-form-actions">
            <Link href="/admin/trending" className="admin-outline-button">
              Cancel
            </Link>
            <button type="submit" className="admin-accent-button">
              Save Changes
            </button>
          </div>
        </section>
      </form>

      <section className="trending-danger-zone">
        <div>
          <h3>Delete Trending Topic</h3>
          <p>
            Permanently remove this topic from the trending registry.
            This action cannot be undone.
          </p>
        </div>

        <form action={deleteTrendingTopic}>
          <input type="hidden" name="id" value={topic.id} />
          <button type="submit" className="trending-delete-button">
            Delete Topic
          </button>
        </form>
      </section>
    </main>
  );
}

async function TrendingManagementRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TrendingManagementContent id={id} />;
}

export default function TrendingManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<TrendingManagementLoading />}>
      <TrendingManagementRoute params={params} />
    </Suspense>
  );
}
