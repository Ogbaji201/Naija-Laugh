import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";

import "../cartoons.css";

/* =========================================================
   TYPES
   ========================================================= */

type Article = {
  id: string;
  headline: string | null;
  slug: string | null;
  published_at: string | null;
};

/* =========================================================
   CREATE CARTOON
   ========================================================= */

async function createCartoon(formData: FormData) {
  "use server";

  const supabase = createAdminClient();

  const articleId = String(
    formData.get("article_id") || ""
  ).trim();

  const concept = String(
    formData.get("concept") || ""
  ).trim();

  const caption = String(
    formData.get("caption") || ""
  ).trim();

  const prompt = String(
    formData.get("prompt") || ""
  ).trim();

  const altText = String(
    formData.get("alt_text") || ""
  ).trim();

  const isCartoonOfDay =
    formData.get("is_cartoon_of_day") === "on";

  /* =======================================================
     VALIDATION
     ======================================================= */

  if (!articleId) {
    throw new Error(
      "Please select a related article."
    );
  }

  if (!concept) {
    throw new Error(
      "Please enter a cartoon concept."
    );
  }

  /* =======================================================
     VERIFY ARTICLE
     ======================================================= */

  const {
    data: article,
    error: articleError,
  } = await supabase
    .from("articles")
    .select("id, headline, slug, published_at")
    .eq("id", articleId)
    .eq("status", "published")
    .single();

  if (articleError || !article) {
    throw new Error(
      "The selected article could not be found or is not published."
    );
  }

  /* =======================================================
     CARTOON OF THE DAY
     ======================================================= */

  if (isCartoonOfDay) {
    const { error: unsetError } = await supabase
      .from("cartoons")
      .update({
        is_cartoon_of_day: false,
      })
      .eq("is_cartoon_of_day", true)
      .neq("status", "rejected");

    if (unsetError) {
      console.error(
        "Unable to clear previous Cartoon of the Day:",
        unsetError
      );

      throw new Error(
        "Unable to update the current Cartoon of the Day."
      );
    }
  }

  /* =======================================================
     INSERT CARTOON
     ======================================================= */

  const {
    data: cartoon,
    error,
  } = await supabase
    .from("cartoons")
    .insert({
      article_id: article.id,
      concept,
      caption: caption || null,
      prompt: prompt || null,
      alt_text: altText || null,
      image_url: null,
      status: "concept",
      is_cartoon_of_day: isCartoonOfDay,
    })
    .select("id")
    .single();

  if (error || !cartoon) {
    console.error(
      "Create cartoon error:",
      error
    );

    throw new Error(
      error?.message ||
        "Unable to create cartoon."
    );
  }

  /*
   * The cartoon management page will be added next.
   * For now, return to the Cartoons dashboard after creation.
   */
  redirect("/admin/cartoons");
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(date: string | null) {
  if (!date) {
    return "Date not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/* =========================================================
   LOADING STATE
   ========================================================= */

function CartoonPageLoading() {
  return (
    <main className="admin-main-content">
      <section className="cartoons-page">
        <div className="cartoons-page-header">
          <div>
            <span className="cartoons-eyebrow">
              EDITORIAL DESK / CARTOONS
            </span>

            <h2>Create Cartoon</h2>

            <p>
              Preparing the cartoon creation workspace...
            </p>
          </div>
        </div>

        <div className="cartoons-empty-state">
          <div className="cartoons-empty-code">
            CT
          </div>

          <h3>Loading editorial workspace</h3>

          <p>
            Loading published stories available for
            cartoon creation.
          </p>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PAGE CONTENT
   ========================================================= */

async function NewCartoonContent() {
  const supabase = createAdminClient();

  /* =======================================================
     GET PUBLISHED ARTICLES
     ======================================================= */

  const {
    data: articles,
    error,
  } = await supabase
    .from("articles")
    .select(
      "id, headline, slug, published_at"
    )
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
    });

  const publishedArticles =
    (articles ?? []) as Article[];

  /* =======================================================
     PAGE
     ======================================================= */

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

            <h2>Create Cartoon</h2>

            <p>
              Create a comic concept from a published
              NaijaLaughs story.
            </p>
          </div>

          <Link
            href="/admin/cartoons"
            className="cartoons-secondary-button"
          >
            ← Back to Cartoons
          </Link>
        </div>

        {/* =================================================
            ARTICLE AVAILABILITY
            ================================================= */}

        {error ? (
          <div className="cartoons-error">
            <strong>
              Unable to load published articles.
            </strong>

            <p>{error.message}</p>
          </div>
        ) : publishedArticles.length === 0 ? (
          <div className="cartoons-empty-state">
            <div className="cartoons-empty-code">
              CT
            </div>

            <h3>
              No published articles available
            </h3>

            <p>
              A cartoon must be connected to a published
              news story before it can be created.
            </p>

            <Link
              href="/admin/news"
              className="cartoons-secondary-button"
            >
              Go to News Review
            </Link>
          </div>
        ) : (
          <form
            action={createCartoon}
            className="cartoons-form"
          >

            {/* =============================================
                RELATED ARTICLE
                ============================================= */}

            <section className="cartoons-form-section">

              <div className="cartoons-form-heading">
                <span>01</span>

                <div>
                  <h3>Related story</h3>

                  <p>
                    Choose the published story that the
                    cartoon will react to.
                  </p>
                </div>
              </div>

              <div className="cartoons-form-field">

                <label htmlFor="article_id">
                  Published article
                  <span>*</span>
                </label>

                <select
                  id="article_id"
                  name="article_id"
                  required
                  defaultValue=""
                >
                  <option
                    value=""
                    disabled
                  >
                    Select a published article
                  </option>

                  {publishedArticles.map(
                    (article) => (
                      <option
                        key={article.id}
                        value={article.id}
                      >
                        {article.headline ||
                          "Untitled article"}{" "}
                        —{" "}
                        {formatDate(
                          article.published_at
                        )}
                      </option>
                    )
                  )}
                </select>

                <small>
                  Only published news stories are available
                  for cartoon creation.
                </small>

              </div>
            </section>

            {/* =============================================
                CONCEPT
                ============================================= */}

            <section className="cartoons-form-section">

              <div className="cartoons-form-heading">
                <span>02</span>

                <div>
                  <h3>Cartoon concept</h3>

                  <p>
                    Describe the central comic idea and
                    what the cartoon is reacting to.
                  </p>
                </div>
              </div>

              <div className="cartoons-form-field">

                <label htmlFor="concept">
                  Concept
                  <span>*</span>
                </label>

                <textarea
                  id="concept"
                  name="concept"
                  required
                  rows={5}
                  placeholder="Example: A Lagos commuter checks the new transport fare on his phone, then looks at his empty wallet in disbelief."
                />

                <small>
                  Focus the joke on the situation,
                  policy or everyday experience — not
                  a protected identity or a person who
                  has been harmed.
                </small>

              </div>

              <div className="cartoons-form-field">

                <label htmlFor="caption">
                  Caption
                </label>

                <textarea
                  id="caption"
                  name="caption"
                  rows={3}
                  placeholder="Short comic caption or punchline."
                />

              </div>
            </section>

            {/* =============================================
                IMAGE DIRECTION
                ============================================= */}

            <section className="cartoons-form-section">

              <div className="cartoons-form-heading">
                <span>03</span>

                <div>
                  <h3>Image direction</h3>

                  <p>
                    Prepare the creative direction that
                    will later be used for AI image generation.
                  </p>
                </div>
              </div>

              <div className="cartoons-form-field">

                <label htmlFor="prompt">
                  AI image prompt
                </label>

                <textarea
                  id="prompt"
                  name="prompt"
                  rows={7}
                  placeholder="Describe the Nigerian setting, characters, expressions, objects, visual joke, composition and atmosphere. Keep the scene editorial and humorous."
                />

                <small>
                  This is the generation brief. The image
                  will not be generated at this stage.
                </small>

              </div>

              <div className="cartoons-form-field">

                <label htmlFor="alt_text">
                  Accessibility alt text
                </label>

                <textarea
                  id="alt_text"
                  name="alt_text"
                  rows={3}
                  placeholder="Describe what the final cartoon shows for users who cannot see the image."
                />

              </div>
            </section>

            {/* =============================================
                PUBLICATION
                ============================================= */}

            <section className="cartoons-form-section">

              <div className="cartoons-form-heading">
                <span>04</span>

                <div>
                  <h3>Publication settings</h3>

                  <p>
                    New cartoons always begin as concepts
                    and must pass editorial review.
                  </p>
                </div>
              </div>

              <label className="cartoons-checkbox-field">

                <input
                  type="checkbox"
                  name="is_cartoon_of_day"
                />

                <span>
                  <strong>
                    Mark as Cartoon of the Day
                  </strong>

                  <small>
                    This will replace the current Cartoon
                    of the Day selection.
                  </small>
                </span>

              </label>

              <div className="cartoons-status-preview">

                <span>
                  INITIAL STATUS
                </span>

                <strong>
                  Concept
                </strong>

                <p>
                  After saving, the cartoon will be sent
                  to editorial review before image generation
                  and publication.
                </p>

              </div>

            </section>

            {/* =============================================
                ACTIONS
                ============================================= */}

            <div className="cartoons-form-actions">

              <Link
                href="/admin/cartoons"
                className="cartoons-cancel-button"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="cartoons-save-button"
              >
                Save Cartoon Concept
              </button>

            </div>

          </form>
        )}

      </section>
    </main>
  );
}

/* =========================================================
   EXPORTED PAGE
   ========================================================= */

export default function NewCartoonPage() {
  return (
    <Suspense fallback={<CartoonPageLoading />}>
      <NewCartoonContent />
    </Suspense>
  );
}