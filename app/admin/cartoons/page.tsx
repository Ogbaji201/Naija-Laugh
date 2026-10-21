import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import "./cartoons.css";


/* =========================================================
   TYPES
   ========================================================= */

type CartoonStatus =
  | "concept"
  | "review"
  | "approved"
  | "rejected"
  | "published";

type CartoonArticle = {
  id: string;
  headline: string | null;
  slug: string | null;
};

type Cartoon = {
  id: string;
  article_id: string;
  concept: string | null;
  image_url: string | null;
  alt_text: string | null;
  caption: string | null;
  status: CartoonStatus;
  is_cartoon_of_day: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  article: CartoonArticle | CartoonArticle[] | null;
};


/* =========================================================
   HELPERS
   ========================================================= */

function getArticle(
  article: Cartoon["article"]
): CartoonArticle | null {
  if (!article) {
    return null;
  }

  if (Array.isArray(article)) {
    return article[0] ?? null;
  }

  return article;
}


function formatDate(date: string | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}


function getStatusLabel(
  status: CartoonStatus
) {
  switch (status) {
    case "concept":
      return "Concept";

    case "review":
      return "In Review";

    case "approved":
      return "Approved";

    case "published":
      return "Published";

    case "rejected":
      return "Rejected";

    default:
      return status;
  }
}


function getStatusClass(
  status: CartoonStatus
) {
  switch (status) {
    case "published":
      return "cartoon-status cartoon-status-published";

    case "approved":
      return "cartoon-status cartoon-status-approved";

    case "review":
      return "cartoon-status cartoon-status-review";

    case "rejected":
      return "cartoon-status cartoon-status-rejected";

    default:
      return "cartoon-status cartoon-status-concept";
  }
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function CartoonsContent() {
  const supabase = createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from("cartoons")
    .select(`
      id,
      article_id,
      concept,
      image_url,
      alt_text,
      caption,
      status,
      is_cartoon_of_day,
      published_at,
      created_at,
      updated_at,
      article:articles (
        id,
        headline,
        slug
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Cartoons dashboard error:",
      error
    );

    return (
      <main className="admin-main-content">

        <section className="cartoons-page">

          <div className="cartoons-page-header">

            <div>

              <span className="cartoons-eyebrow">
                EDITORIAL DESK
              </span>

              <h2>
                Cartoons
              </h2>

              <p>
                Manage AI-generated comic concepts,
                editorial review and publication.
              </p>

            </div>

          </div>


          <div className="cartoons-error">

            <strong>
              Unable to load cartoons.
            </strong>

            <p>
              {error.message}
            </p>

          </div>

        </section>

      </main>
    );
  }

  const cartoons =
    (data ?? []) as unknown as Cartoon[];


  /* =======================================================
     STATISTICS
     ======================================================= */

  const total =
    cartoons.length;

  const concepts =
    cartoons.filter(
      (cartoon) =>
        cartoon.status === "concept"
    ).length;

  const review =
    cartoons.filter(
      (cartoon) =>
        cartoon.status === "review"
    ).length;

  const approved =
    cartoons.filter(
      (cartoon) =>
        cartoon.status === "approved"
    ).length;

  const published =
    cartoons.filter(
      (cartoon) =>
        cartoon.status === "published"
    ).length;


  return (
    <main className="admin-main-content">

      <section className="cartoons-page">


        {/* =================================================
            PAGE HEADER
            ================================================= */}

        <div className="cartoons-page-header">

          <div>

            <span className="cartoons-eyebrow">
              EDITORIAL DESK / CARTOONS
            </span>

            <h2>
              Cartoons
            </h2>

            <p>
              Manage AI-generated comic concepts,
              editorial review and publication.
            </p>

          </div>


          <Link
            href="/admin/cartoons/new"
            className="cartoons-primary-button"
          >
            <span>
              +
            </span>

            Create Cartoon
          </Link>

        </div>


        {/* =================================================
            STATISTICS
            ================================================= */}

        <section className="cartoons-stats">

          <div className="cartoons-stat-card">

            <span className="cartoons-stat-label">
              TOTAL
            </span>

            <strong>
              {total}
            </strong>

            <span className="cartoons-stat-description">
              All cartoon records
            </span>

          </div>


          <div className="cartoons-stat-card">

            <span className="cartoons-stat-label">
              CONCEPTS
            </span>

            <strong>
              {concepts}
            </strong>

            <span className="cartoons-stat-description">
              Awaiting editorial review
            </span>

          </div>


          <div className="cartoons-stat-card">

            <span className="cartoons-stat-label">
              IN REVIEW
            </span>

            <strong>
              {review}
            </strong>

            <span className="cartoons-stat-description">
              Currently being reviewed
            </span>

          </div>


          <div className="cartoons-stat-card">

            <span className="cartoons-stat-label">
              APPROVED
            </span>

            <strong>
              {approved}
            </strong>

            <span className="cartoons-stat-description">
              Ready for publication
            </span>

          </div>


          <div className="cartoons-stat-card">

            <span className="cartoons-stat-label">
              PUBLISHED
            </span>

            <strong>
              {published}
            </strong>

            <span className="cartoons-stat-description">
              Live on the website
            </span>

          </div>

        </section>


        {/* =================================================
            WORKFLOW
            ================================================= */}

        <section className="cartoons-workflow">

          <div className="cartoons-section-heading">

            <div>

              <span>
                EDITORIAL WORKFLOW
              </span>

              <h3>
                Cartoon pipeline
              </h3>

            </div>

          </div>


          <div className="cartoons-workflow-track">

            <div className="cartoon-workflow-step">

              <span className="cartoon-workflow-number">
                01
              </span>

              <div>

                <strong>
                  Concept
                </strong>

                <p>
                  Create the comic idea from
                  a news story.
                </p>

              </div>

            </div>


            <span className="cartoon-workflow-line" />


            <div className="cartoon-workflow-step">

              <span className="cartoon-workflow-number">
                02
              </span>

              <div>

                <strong>
                  Review
                </strong>

                <p>
                  Check the concept for editorial
                  suitability.
                </p>

              </div>

            </div>


            <span className="cartoon-workflow-line" />


            <div className="cartoon-workflow-step">

              <span className="cartoon-workflow-number">
                03
              </span>

              <div>

                <strong>
                  Approved
                </strong>

                <p>
                  Clear the concept for image
                  generation.
                </p>

              </div>

            </div>


            <span className="cartoon-workflow-line" />


            <div className="cartoon-workflow-step">

              <span className="cartoon-workflow-number">
                04
              </span>

              <div>

                <strong>
                  Published
                </strong>

                <p>
                  Publish the approved cartoon
                  to the website.
                </p>

              </div>

            </div>

          </div>

        </section>


        {/* =================================================
            CARTOON LIBRARY
            ================================================= */}

        <section className="cartoons-list-section">

          <div className="cartoons-section-heading">

            <div>

              <span>
                CARTOON LIBRARY
              </span>

              <h3>
                All cartoons
              </h3>

            </div>

            <span className="cartoons-record-count">
              {total}{" "}
              {total === 1
                ? "record"
                : "records"}
            </span>

          </div>


          {cartoons.length === 0 ? (

            <div className="cartoons-empty-state">

              <div className="cartoons-empty-code">
                CT
              </div>

              <h3>
                No cartoons yet
              </h3>

              <p>
                Create the first cartoon concept
                from a published news story.
              </p>

              <Link
                href="/admin/cartoons/new"
                className="cartoons-secondary-button"
              >
                Create Cartoon
              </Link>

            </div>

          ) : (

            <div className="cartoons-table-wrapper">

              <table className="cartoons-table">

                <thead>

                  <tr>

                    <th>
                      Concept
                    </th>

                    <th>
                      Related Article
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Cartoon of the Day
                    </th>

                    <th>
                      Created
                    </th>

                    <th>
                      Manage
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {cartoons.map(
                    (cartoon) => {

                      const article =
                        getArticle(
                          cartoon.article
                        );

                      return (
                        <tr
                          key={cartoon.id}
                        >

                          {/* CONCEPT */}

                          <td>

                            <div className="cartoons-concept-cell">

                              {cartoon.image_url ? (

                                <div className="cartoon-thumbnail">

                                  <img
                                    src={
                                      cartoon.image_url
                                    }
                                    alt={
                                      cartoon.alt_text ||
                                      "Cartoon preview"
                                    }
                                  />

                                </div>

                              ) : (

                                <div className="cartoon-thumbnail cartoon-thumbnail-empty">
                                  CT
                                </div>

                              )}


                              <div>

                                <div className="cartoons-primary-text">
                                  {cartoon.concept ||
                                    "Untitled concept"}
                                </div>


                                {cartoon.caption && (
                                  <div className="cartoons-secondary-text">
                                    {cartoon.caption}
                                  </div>
                                )}

                              </div>

                            </div>

                          </td>


                          {/* ARTICLE */}

                          <td>

                            <div className="cartoons-article-cell">

                              <span className="cartoons-article-title">

                                {article?.headline ||
                                  "Article unavailable"}

                              </span>

                              <span className="cartoons-article-id">

                                {cartoon.article_id.slice(
                                  0,
                                  8
                                )}

                              </span>

                            </div>

                          </td>


                          {/* STATUS */}

                          <td>

                            <span
                              className={
                                getStatusClass(
                                  cartoon.status
                                )
                              }
                            >
                              {getStatusLabel(
                                cartoon.status
                              )}
                            </span>

                          </td>


                          {/* CARTOON OF DAY */}

                          <td>

                            {cartoon.is_cartoon_of_day ? (

                              <span className="cartoon-day-badge">
                                Cartoon of the Day
                              </span>

                            ) : (

                              <span className="cartoon-not-day">
                                —
                              </span>

                            )}

                          </td>


                          {/* CREATED */}

                          <td>

                            <span className="cartoons-date">
                              {formatDate(
                                cartoon.created_at
                              )}
                            </span>

                          </td>


                          {/* MANAGE */}

                          <td>

                            <Link
                              href={`/admin/cartoons/${cartoon.id}`}
                              className="cartoons-manage-link"
                            >
                              Manage

                              <span>
                                →
                              </span>

                            </Link>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </section>

    </main>
  );
}


/* =========================================================
   LOADING
   ========================================================= */

function CartoonsLoading() {
  return (
    <main className="admin-main-content">

      <section className="cartoons-loading">

        <span />

        <h1>
          Loading cartoons
        </h1>

        <p>
          Preparing the editorial cartoon desk...
        </p>

      </section>

    </main>
  );
}


/* =========================================================
   PAGE
   ========================================================= */

export default function CartoonsAdminPage() {
  return (
    <Suspense
      fallback={<CartoonsLoading />}
    >
      <CartoonsContent />
    </Suspense>
  );
}