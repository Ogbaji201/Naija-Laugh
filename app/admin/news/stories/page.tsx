import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Story = {
  id: string;
  title: string;
  summary: string | null;
  region: string;
  status: string;
  event_date: string | null;
  created_at: string;
  updated_at: string;
  category: Category | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

async function createStory(formData: FormData) {
  "use server";

  const title = String(formData.get("title") || "").trim();
  const summary =
    String(formData.get("summary") || "").trim() || null;
  const region = String(formData.get("region") || "").trim();
  const categoryId =
    String(formData.get("category_id") || "").trim() || null;
  const status =
    String(formData.get("status") || "new").trim();
  const eventDate =
    String(formData.get("event_date") || "").trim() || null;

  if (!title || !region) {
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("stories")
    .insert({
      title,
      summary,
      region,
      category_id: categoryId,
      status,
      event_date: eventDate
        ? new Date(eventDate).toISOString()
        : null,
    });

  if (error) {
    console.error("Create story error:", error);
    return;
  }

  redirect("/admin/news/stories");
}

async function StoriesContent() {
  const supabase = createAdminClient();

  const [{ data: stories, error: storiesError }, { data: categories }] =
    await Promise.all([
      supabase
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
        .order("updated_at", {
          ascending: false,
        }),

      supabase
        .from("categories")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name", {
          ascending: true,
        }),
    ]);

  if (storiesError) {
    console.error(
      "Stories fetch error:",
      storiesError
    );
  }

  const storyList = (stories ?? []).map((story) => ({
    ...story,
    category:
      Array.isArray(story.category)
        ? story.category[0] ?? null
        : story.category ?? null,
  })) as Story[];

  const categoryList = (categories ?? []) as Category[];

  const regions = new Set(
    storyList.map((story) => story.region)
  );

  return (
    <main className="admin-main-content">
      <section className="sources-page">

        {/* =====================================================
            PAGE HEADER
            ===================================================== */}

        <div className="sources-page-header">

          <div>
            <span className="admin-breadcrumb">
              NEWSROOM / STORIES
            </span>

            <h1>Story Management</h1>

            <p>
              Organise source material into editorial
              stories before AI drafting begins.
            </p>
          </div>

          <div className="sources-page-header-actions">

            <Link
              href="/admin/news/intake"
              className="admin-outline-button"
            >
              News Intake
            </Link>

            <Link
              href="/admin/news?status=needs_review"
              className="admin-outline-button"
            >
              News Review
            </Link>

          </div>

        </div>


        {/* =====================================================
            SUMMARY
            ===================================================== */}

        <div className="sources-summary">

          <div className="sources-summary-card">
            <span className="sources-summary-label">
              Total Stories
            </span>

            <strong>
              {storyList.length}
            </strong>
          </div>

          <div className="sources-summary-card">
            <span className="sources-summary-label">
              Categories
            </span>

            <strong>
              {categoryList.length}
            </strong>
          </div>

          <div className="sources-summary-card">
            <span className="sources-summary-label">
              Regions
            </span>

            <strong>
              {regions.size}
            </strong>
          </div>

        </div>


        {/* =====================================================
            MAIN LAYOUT
            ===================================================== */}

        <div className="sources-layout">

          {/* ===================================================
              CREATE STORY
              =================================================== */}

          <div className="sources-panel">

            <div className="sources-panel-header">

              <div>
                <span className="sources-panel-label">
                  STORY MANAGEMENT
                </span>

                <h2>Create Story</h2>

                <p>
                  Create an editorial story that can
                  later be developed into an AI draft.
                </p>
              </div>

            </div>


            <form
              action={createStory}
              className="sources-form"
            >

              {/* STORY TITLE */}

              <div className="sources-field">

                <label htmlFor="title">
                  Story Title
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Enter the main story title"
                  required
                />

              </div>


              {/* STORY SUMMARY */}

              <div className="sources-field">

                <label htmlFor="summary">
                  Story Summary
                </label>

                <textarea
                  id="summary"
                  name="summary"
                  rows={5}
                  placeholder="Briefly describe what this story is about..."
                />

              </div>


              {/* REGION */}

              <div className="sources-field">

                <label htmlFor="region">
                  Region
                </label>

                <select
                  id="region"
                  name="region"
                  defaultValue=""
                  required
                >

                  <option value="" disabled>
                    Select region
                  </option>

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


              {/* CATEGORY */}

              <div className="sources-field">

                <label htmlFor="category_id">
                  Category
                </label>

                <select
                  id="category_id"
                  name="category_id"
                  defaultValue=""
                >

                  <option value="">
                    Select category
                  </option>

                  {categoryList.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  ))}

                </select>

              </div>


              {/* STATUS */}

              <div className="sources-field">

                <label htmlFor="status">
                  Editorial Status
                </label>

                <select
                  id="status"
                  name="status"
                  defaultValue="new"
                >

                  <option value="new">
                    New
                  </option>

                  <option value="researching">
                    Researching
                  </option>

                  <option value="ready_for_draft">
                    Ready for Draft
                  </option>

                  <option value="drafting">
                    Drafting
                  </option>

                </select>

              </div>


              {/* EVENT DATE */}

              <div className="sources-field">

                <label htmlFor="event_date">
                  Event Date
                </label>

                <input
                  id="event_date"
                  name="event_date"
                  type="datetime-local"
                />

              </div>


              {/* FORM FOOTER */}

              <div className="sources-form-footer">

                <p>
                  Stories remain internal until they
                  enter the AI editorial pipeline.
                </p>

                <button
                  type="submit"
                  className="admin-accent-button"
                >
                  Create Story
                </button>

              </div>

            </form>

          </div>


          {/* ===================================================
              STORY QUEUE
              =================================================== */}

          <div className="sources-panel">

            <div className="sources-panel-header">

              <div>
                <span className="sources-panel-label">
                  EDITORIAL STORIES
                </span>

                <h2>Story Queue</h2>

                <p>
                  Stories currently being organised
                  by the newsroom.
                </p>
              </div>

              <span className="sources-list-count">
                {storyList.length}
              </span>

            </div>


            {storyList.length === 0 ? (

              <div className="sources-empty">

                <span>00</span>

                <h3>
                  No stories created
                </h3>

                <p>
                  Create the first editorial story
                  using the form.
                </p>

              </div>

            ) : (

              <div className="sources-list">

                {storyList.map((story) => (

                  <article
                    key={story.id}
                    className="source-item"
                  >

                    <div className="source-item-main">

                      <div className="source-item-heading">

                        <div>

                          <span className="source-status">
                            {statusLabel(story.status)}
                          </span>

                          <h3>
                            <Link
                              href={`/admin/news/stories/${story.id}`}
                              className="story-title-link"
                            >
                              {story.title}
                            </Link>
                          </h3>

                        </div>

                      </div>


                      <div className="source-item-meta">

                        <span>
                          {story.region}
                        </span>

                        <span>
                          {story.category?.name ||
                            "Uncategorised"}
                        </span>

                        <span>
                          Updated{" "}
                          {formatDate(
                            story.updated_at
                          )}
                        </span>

                      </div>


                      {story.summary && (
                        <p>
                          {story.summary}
                        </p>
                      )}


                      <div className="source-item-links">

                        <span>
                          Event:{" "}
                          {formatDate(
                            story.event_date
                          )}
                        </span>

                        <span>
                          Created:{" "}
                          {formatDate(
                            story.created_at
                          )}
                        </span>

                        <Link
                          href={`/admin/news/stories/${story.id}`}
                          className="admin-outline-button"
                        >
                          Open Story →
                        </Link>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

            )}

          </div>

        </div>

      </section>
    </main>
  );
}


function StoriesLoading() {
  return (
    <main className="admin-main-content">
      <section className="sources-loading">

        <span />

        <h1>
          Loading story management
        </h1>

        <p>
          Retrieving newsroom stories...
        </p>

      </section>
    </main>
  );
}


export default function StoriesPage() {
  return (
    <Suspense fallback={<StoriesLoading />}>
      <StoriesContent />
    </Suspense>
  );
}