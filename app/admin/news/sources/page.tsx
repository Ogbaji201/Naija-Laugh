import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

type Source = {
  id: string;
  name: string;
  website: string | null;
  rss_url: string | null;
  source_type: string;
  region: string;
  active: boolean;
  reliability_notes: string | null;
  created_at: string;
};

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

/* =========================================================
   ADD SOURCE
   ========================================================= */

async function addSource(formData: FormData) {
  "use server";

  const name = String(
    formData.get("name") || ""
  ).trim();

  const website = String(
    formData.get("website") || ""
  ).trim();

  const rssUrl = String(
    formData.get("rss_url") || ""
  ).trim();

  const sourceType = String(
    formData.get("source_type") || ""
  ).trim();

  const region = String(
    formData.get("region") || ""
  ).trim();

  const reliabilityNotes = String(
    formData.get("reliability_notes") || ""
  ).trim();

  if (!name || !sourceType || !region) {
    throw new Error(
      "Source name, source type and region are required."
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sources")
    .insert({
      name,
      website: website || null,
      rss_url: rssUrl || null,
      source_type: sourceType,
      region,
      active: true,
      reliability_notes:
        reliabilityNotes || null,
    });

  if (error) {
    console.error(
      "Source insert error:",
      error
    );

    throw new Error(error.message);
  }

  redirect("/admin/news/sources");
}

/* =========================================================
   TOGGLE SOURCE
   ========================================================= */

async function toggleSource(formData: FormData) {
  "use server";

  const sourceId = String(
    formData.get("source_id") || ""
  ).trim();

  const currentActive =
    String(
      formData.get("active") || ""
    ) === "true";

  if (!sourceId) {
    throw new Error(
      "Source ID is required."
    );
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("sources")
    .update({
      active: !currentActive,
    })
    .eq("id", sourceId);

  if (error) {
    console.error(
      "Source update error:",
      error
    );

    throw new Error(error.message);
  }

  redirect("/admin/news/sources");
}

/* =========================================================
   SOURCE CONTENT
   ========================================================= */

async function SourcesContent() {
  const supabase = createAdminClient();

  const {
    data: sources,
    error,
  } = await supabase
    .from("sources")
    .select(`
      id,
      name,
      website,
      rss_url,
      source_type,
      region,
      active,
      reliability_notes,
      created_at
    `)
    .order("active", {
      ascending: false,
    })
    .order("name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Sources fetch error:",
      error
    );
  }

  const sourceList =
    (sources ?? []) as Source[];

  const activeSources =
    sourceList.filter(
      (source) => source.active
    );

  const inactiveSources =
    sourceList.filter(
      (source) => !source.active
    );

  return (
    <main className="admin-main-content">

      <div className="sources-page">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="sources-page-header">

          <div>

            <span className="admin-breadcrumb">
              NEWSROOM / SOURCES
            </span>

            <h2>
              Source Registry
            </h2>

            <p>
              Manage the trusted sources used by the
              NaijaLaughs newsroom and AI editorial pipeline.
            </p>

          </div>

          <div className="sources-header-actions">

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


        {/* =================================================
            SUMMARY
            ================================================= */}

        <div className="sources-summary">

          <div className="sources-summary-card">

            <span>
              TOTAL SOURCES
            </span>

            <strong>
              {sourceList.length}
            </strong>

          </div>


          <div className="sources-summary-card">

            <span>
              ACTIVE
            </span>

            <strong>
              {activeSources.length}
            </strong>

          </div>


          <div className="sources-summary-card">

            <span>
              INACTIVE
            </span>

            <strong>
              {inactiveSources.length}
            </strong>

          </div>

        </div>


        {/* =================================================
            ADD SOURCE + SOURCE LIST
            ================================================= */}

        <div className="sources-layout">

          {/* ===============================================
              ADD SOURCE
              =============================================== */}

          <section className="sources-panel">

            <div className="sources-panel-header">

              <span className="sources-panel-label">
                SOURCE REGISTRY
              </span>

              <h3>
                Add Source
              </h3>

              <p>
                Register a newsroom, publisher,
                broadcaster or other trusted source.
              </p>

            </div>


            <form
              action={addSource}
              className="sources-form"
            >

              {/* NAME */}

              <div className="sources-field">

                <label htmlFor="name">
                  Source Name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Premium Times"
                  required
                />

              </div>


              {/* WEBSITE */}

              <div className="sources-field">

                <label htmlFor="website">
                  Website
                </label>

                <input
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                />

              </div>


              {/* RSS */}

              <div className="sources-field">

                <label htmlFor="rss_url">
                  RSS Feed URL
                </label>

                <input
                  id="rss_url"
                  name="rss_url"
                  type="url"
                  placeholder="https://example.com/rss"
                />

                <small>
                  Add an RSS feed when the source
                  provides one. This will support
                  future automated intake.
                </small>

              </div>


              {/* SOURCE TYPE */}

              <div className="sources-field">

                <label htmlFor="source_type">
                  Source Type
                </label>

              <select
                id="source_type"
                name="source_type"
                defaultValue=""
                required
              >
                <option
                  value=""
                  disabled
                >
                  Select source type
                </option>

                <option value="official">
                  Official Source
                </option>

                <option value="publisher">
                  Publisher
                </option>

                <option value="rss">
                  RSS Feed
                </option>

                <option value="api">
                  API
                </option>

                <option value="social">
                  Social Media
                </option>
              </select>

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

                  <option
                    value=""
                    disabled
                  >
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


              {/* NOTES */}

              <div className="sources-field">

                <label htmlFor="reliability_notes">
                  Reliability Notes
                </label>

                <textarea
                  id="reliability_notes"
                  name="reliability_notes"
                  rows={4}
                  placeholder="Add internal notes about this source..."
                />

              </div>


              {/* FOOTER */}

              <div className="sources-form-footer">

                <span>
                  New sources are active by default.
                </span>

                <button
                  type="submit"
                  className="admin-accent-button"
                >
                  Add Source
                </button>

              </div>

            </form>

          </section>


          {/* ===============================================
              SOURCE LIST
              =============================================== */}

          <section className="sources-panel">

            <div className="sources-panel-header">

              <div className="sources-list-header">

                <div>

                  <span className="sources-panel-label">
                    REGISTERED SOURCES
                  </span>

                  <h3>
                    News Sources
                  </h3>

                </div>

                <span className="sources-list-count">
                  {sourceList.length}
                </span>

              </div>

              <p>
                Active sources can be selected during
                News Intake.
              </p>

            </div>


            {sourceList.length === 0 ? (

              <div className="sources-empty">

                <span>
                  00
                </span>

                <h3>
                  No sources registered
                </h3>

                <p>
                  Add your first trusted news source
                  using the form.
                </p>

              </div>

            ) : (

              <div className="sources-list">

                {sourceList.map(
                  (source) => (

                    <article
                      key={source.id}
                      className="source-item"
                    >

                      <div className="source-item-main">

                        <div className="source-item-heading">

                          <span
                            className={
                              source.active
                                ? "source-status active"
                                : "source-status inactive"
                            }
                          >
                            {source.active
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>

                          <h3>
                            {source.name}
                          </h3>

                        </div>


                        <div className="source-item-meta">

                          <span>
                            {source.source_type}
                          </span>

                          <span>
                            {source.region}
                          </span>

                          <span>
                            Added{" "}
                            {formatDate(
                              source.created_at
                            )}
                          </span>

                        </div>


                        {source.reliability_notes && (
                          <p>
                            {source.reliability_notes}
                          </p>
                        )}


                        <div className="source-item-links">

                          {source.website && (
                            <a
                              href={source.website}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Website →
                            </a>
                          )}

                          {source.rss_url && (
                            <a
                              href={source.rss_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              RSS Feed →
                            </a>
                          )}

                        </div>

                      </div>


                      <form
                        action={toggleSource}
                        className="source-toggle-form"
                      >

                        <input
                          type="hidden"
                          name="source_id"
                          value={source.id}
                        />

                        <input
                          type="hidden"
                          name="active"
                          value={
                            source.active
                              ? "true"
                              : "false"
                          }
                        />

                        <button
                          type="submit"
                          className={
                            source.active
                              ? "source-toggle-button deactivate"
                              : "source-toggle-button activate"
                          }
                        >
                          {source.active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                      </form>

                    </article>

                  )
                )}

              </div>

            )}

          </section>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   LOADING
   ========================================================= */

function SourcesLoading() {
  return (
    <main className="admin-main-content">

      <section className="sources-loading">

        <span />

        <h1>
          Loading source registry
        </h1>

        <p>
          Retrieving newsroom sources...
        </p>

      </section>

    </main>
  );
}


/* =========================================================
   PAGE
   ========================================================= */

export default function SourcesPage() {
  return (
    <Suspense
      fallback={
        <SourcesLoading />
      }
    >
      <SourcesContent />
    </Suspense>
  );
}