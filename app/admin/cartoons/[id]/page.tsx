import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";

import "../cartoons.css";
import GenerateCartoonImage from "./GenerateCartoonImage";

/* =========================================================
   TYPES
   ========================================================= */

type Cartoon = {
  id: string;
  article_id: string;
  concept: string | null;
  prompt: string | null;
  image_url: string | null;
  alt_text: string | null;
  caption: string | null;
  status:
    | "concept"
    | "review"
    | "approved"
    | "rejected"
    | "published";
  is_cartoon_of_day: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type Article = {
  id: string;
  headline: string | null;
  slug: string | null;
  status: string | null;
  published_at: string | null;
};

/* =========================================================
   HELPERS
   ========================================================= */

function formatDate(date: string | null) {
  if (!date) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusLabel(status: Cartoon["status"]) {
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

/* =========================================================
   UPDATE STATUS
   ========================================================= */

async function updateCartoonStatus(
  cartoonId: string,
  status: Cartoon["status"]
) {
  "use server";

  const supabase = createAdminClient();

  const {
    data: cartoon,
    error: cartoonError,
  } = await supabase
    .from("cartoons")
    .select("id, status")
    .eq("id", cartoonId)
    .single();

  if (cartoonError || !cartoon) {
    throw new Error("Cartoon could not be found.");
  }

  const allowedTransitions: Record<
    Cartoon["status"],
    Cartoon["status"][]
  > = {
    concept: ["review", "rejected"],
    review: ["approved", "rejected", "concept"],
    approved: ["published", "review", "rejected"],
    published: ["rejected"],
    rejected: ["concept"],
  };

  const currentStatus =
    cartoon.status as Cartoon["status"];

  if (
    !allowedTransitions[currentStatus].includes(status)
  ) {
    throw new Error(
      `Cannot move cartoon from ${currentStatus} to ${status}.`
    );
  }

  const updateData: {
    status: Cartoon["status"];
    published_at?: string | null;
  } = {
    status,
  };

  if (status === "published") {
    updateData.published_at =
      new Date().toISOString();
  } else {
    updateData.published_at = null;
  }

  const { error } = await supabase
    .from("cartoons")
    .update(updateData)
    .eq("id", cartoonId);

  if (error) {
    throw new Error(
      error.message ||
        "Unable to update cartoon status."
    );
  }

  revalidatePath("/admin/cartoons");
  revalidatePath(`/admin/cartoons/${cartoonId}`);
  revalidatePath("/");
  revalidatePath("/trending");

  redirect(`/admin/cartoons/${cartoonId}`);
}

/* =========================================================
   CARTOON OF THE DAY
   ========================================================= */

async function toggleCartoonOfDay(
  cartoonId: string,
  makeCartoonOfDay: boolean
) {
  "use server";

  const supabase = createAdminClient();

  const {
    data: cartoon,
    error: cartoonError,
  } = await supabase
    .from("cartoons")
    .select("id, status")
    .eq("id", cartoonId)
    .single();

  if (cartoonError || !cartoon) {
    throw new Error("Cartoon could not be found.");
  }

  if (
    makeCartoonOfDay &&
    cartoon.status !== "published"
  ) {
    throw new Error(
      "Only a published cartoon can be marked as Cartoon of the Day."
    );
  }

  if (makeCartoonOfDay) {
    const { error: clearError } =
      await supabase
        .from("cartoons")
        .update({
          is_cartoon_of_day: false,
        })
        .eq("is_cartoon_of_day", true)
        .neq("id", cartoonId);

    if (clearError) {
      throw new Error(
        clearError.message ||
          "Unable to update the current Cartoon of the Day."
      );
    }
  }

  const { error } = await supabase
    .from("cartoons")
    .update({
      is_cartoon_of_day: makeCartoonOfDay,
    })
    .eq("id", cartoonId);

  if (error) {
    throw new Error(
      error.message ||
        "Unable to update Cartoon of the Day."
    );
  }

  revalidatePath("/admin/cartoons");
  revalidatePath(`/admin/cartoons/${cartoonId}`);
  revalidatePath("/");

  redirect(`/admin/cartoons/${cartoonId}`);
}

/* =========================================================
   LOADING
   ========================================================= */

function CartoonManagementLoading() {
  return (
    <main className="admin-main-content">
      <section className="cartoons-page">
        <div className="cartoons-page-header">
          <div>
            <span className="cartoons-eyebrow">
              EDITORIAL DESK / CARTOONS
            </span>

            <h2>Cartoon Management</h2>

            <p>
              Loading editorial workspace...
            </p>
          </div>
        </div>

        <div className="cartoons-empty-state">
          <div className="cartoons-empty-code">
            CT
          </div>

          <h3>Loading cartoon</h3>

          <p>
            Preparing the editorial review workspace.
          </p>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   PAGE CONTENT
   ========================================================= */

async function CartoonManagementContent({
  id,
}: {
  id: string;
}) {
  const supabase = createAdminClient();

  const {
    data: cartoonData,
    error: cartoonError,
  } = await supabase
    .from("cartoons")
    .select(`
      id,
      article_id,
      concept,
      prompt,
      image_url,
      alt_text,
      caption,
      status,
      is_cartoon_of_day,
      published_at,
      created_at,
      updated_at
    `)
    .eq("id", id)
    .single();

  if (cartoonError || !cartoonData) {
    notFound();
  }

  const cartoon =
    cartoonData as Cartoon;

  const {
    data: articleData,
  } = await supabase
    .from("articles")
    .select(
      "id, headline, slug, status, published_at"
    )
    .eq("id", cartoon.article_id)
    .maybeSingle();

  const article =
    (articleData ?? null) as Article | null;

  const status = cartoon.status;

  const canSendToReview =
    status === "concept";

  const canApprove =
    status === "review";

  const canReject =
    status === "concept" ||
    status === "review" ||
    status === "approved" ||
    status === "published";

  const canSendBack =
    status === "review" ||
    status === "approved";

  const canPublish =
    status === "approved" &&
    Boolean(cartoon.image_url);

  const canMarkCartoonOfDay =
    status === "published";

  return (
    <main className="admin-main-content">
      <section className="cartoons-page">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="cartoons-page-header">
          <div>
            <span className="cartoons-eyebrow">
              EDITORIAL DESK / CARTOONS
            </span>

            <h2>
              Cartoon Management
            </h2>

            <p>
              Review the concept, creative direction and
              publication status of this cartoon.
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
            STATUS
            ================================================= */}

        <section className="cartoons-form-section">

          <div className="cartoons-form-heading">
            <span>01</span>

            <div>
              <h3>
                Editorial status
              </h3>

              <p>
                Current position in the cartoon
                editorial workflow.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <span
              className={`cartoon-status cartoon-status-${status}`}
            >
              {getStatusLabel(status)}
            </span>

            {cartoon.is_cartoon_of_day && (
              <span className="cartoon-day-badge">
                CARTOON OF THE DAY
              </span>
            )}
          </div>

        </section>

        {/* =================================================
            RELATED STORY
            ================================================= */}

        <section className="cartoons-form-section">

          <div className="cartoons-form-heading">
            <span>02</span>

            <div>
              <h3>
                Related news story
              </h3>

              <p>
                The published article that inspired
                this cartoon.
              </p>
            </div>
          </div>

          <div className="cartoons-article-cell">

            <strong className="cartoons-primary-text">
              {article?.headline ||
                "Article unavailable"}
            </strong>

            {article?.slug && (
              <Link
                href={`/article/${article.slug}`}
                target="_blank"
                className="cartoons-manage-link"
              >
                View published article
                <span>→</span>
              </Link>
            )}

          </div>

        </section>

        {/* =================================================
            CONCEPT
            ================================================= */}

        <section className="cartoons-form-section">

          <div className="cartoons-form-heading">
            <span>03</span>

            <div>
              <h3>
                Cartoon concept
              </h3>

              <p>
                Editorial idea and comic direction.
              </p>
            </div>
          </div>

          <div className="cartoons-form-field">

            <label>
              Concept
            </label>

            <div
              style={{
                padding: "15px",
                border: "1px solid #e0e2e3",
                background: "#fafafa",
                color: "#34373a",
                fontSize: "12px",
                lineHeight: "1.65",
              }}
            >
              {cartoon.concept ||
                "No concept provided."}
            </div>

          </div>

          <div className="cartoons-form-field">

            <label>
              Caption
            </label>

            <div
              style={{
                padding: "15px",
                border: "1px solid #e0e2e3",
                background: "#fafafa",
                color: "#34373a",
                fontSize: "12px",
                lineHeight: "1.65",
              }}
            >
              {cartoon.caption ||
                "No caption provided."}
            </div>

          </div>

        </section>

        {/* =================================================
            IMAGE DIRECTION
            ================================================= */}

        <section className="cartoons-form-section">

          <div className="cartoons-form-heading">
            <span>04</span>

            <div>
              <h3>
                Image direction
              </h3>

              <p>
                Creative brief prepared for AI image
                generation.
              </p>
            </div>
          </div>

          <div className="cartoons-form-field">

            <label>
              AI image prompt
            </label>

            <div
              style={{
                padding: "15px",
                border: "1px solid #e0e2e3",
                background: "#fafafa",
                color: "#34373a",
                fontSize: "11px",
                lineHeight: "1.65",
                whiteSpace: "pre-wrap",
              }}
            >
              {cartoon.prompt ||
                "No AI image prompt has been provided."}
            </div>

          </div>

          <div className="cartoons-form-field">

            <label>
              Accessibility alt text
            </label>

            <div
              style={{
                padding: "15px",
                border: "1px solid #e0e2e3",
                background: "#fafafa",
                color: "#34373a",
                fontSize: "11px",
                lineHeight: "1.65",
              }}
            >
              {cartoon.alt_text ||
                "No alt text has been provided yet."}
            </div>

          </div>

        </section>

        {/* =================================================
            IMAGE WORKSPACE
            ================================================= */}

        <section className="cartoons-form-section">

          <div className="cartoons-form-heading">
            <span>05</span>

            <div>
              <h3>
                Cartoon image
              </h3>

              <p>
                AI-generated editorial artwork for this
                story.
              </p>
            </div>
          </div>

          {cartoon.image_url ? (
            <div
              style={{
                width: "100%",
                maxWidth: "760px",
                border: "1px solid #dfe1e3",
                background: "#f5f6f6",
                overflow: "hidden",
              }}
            >
              <img
                src={cartoon.image_url}
                alt={
                  cartoon.alt_text ||
                  "NaijaLaughs cartoon"
                }
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                }}
              />
            </div>
          ) : (
            <div
              className="cartoons-empty-state"
              style={{
                padding: "45px 25px",
              }}
            >
              <div className="cartoons-empty-code">
                AI
              </div>

              <h3>
                No image generated yet
              </h3>

              <p>
                The creative direction has been prepared.
                Generate an AI image when the cartoon has
                been approved.
              </p>

              <GenerateCartoonImage
                cartoonId={cartoon.id}
                canGenerate={
                  status === "approved"
                }
              />
            </div>
          )}

          {cartoon.image_url && (
            <div
              style={{
                marginTop: "18px",
              }}
            >
              <GenerateCartoonImage
                cartoonId={cartoon.id}
                canGenerate={
                  status === "approved"
                }
                regenerate
              />
            </div>
          )}

        </section>

        {/* =================================================
            EDITORIAL ACTIONS
            ================================================= */}

        <section className="cartoons-form-section">

          <div className="cartoons-form-heading">
            <span>06</span>

            <div>
              <h3>
                Editorial actions
              </h3>

              <p>
                Move the cartoon through the editorial
                approval workflow.
              </p>
            </div>
          </div>

          <div className="cartoons-form-actions">

            {canSendToReview && (
              <form
                action={async () => {
                  "use server";

                  await updateCartoonStatus(
                    cartoon.id,
                    "review"
                  );
                }}
              >
                <button
                  type="submit"
                  className="cartoons-secondary-button"
                >
                  Send to Review
                </button>
              </form>
            )}

            {canSendBack && (
              <form
                action={async () => {
                  "use server";

                  await updateCartoonStatus(
                    cartoon.id,
                    "concept"
                  );
                }}
              >
                <button
                  type="submit"
                  className="cartoons-secondary-button"
                >
                  Send Back
                </button>
              </form>
            )}

            {canApprove && (
              <form
                action={async () => {
                  "use server";

                  await updateCartoonStatus(
                    cartoon.id,
                    "approved"
                  );
                }}
              >
                <button
                  type="submit"
                  className="cartoons-save-button"
                >
                  Approve Cartoon
                </button>
              </form>
            )}

            {canReject && (
              <form
                action={async () => {
                  "use server";

                  await updateCartoonStatus(
                    cartoon.id,
                    "rejected"
                  );
                }}
              >
                <button
                  type="submit"
                  className="cartoons-cancel-button"
                >
                  Reject
                </button>
              </form>
            )}

            {canPublish && (
              <form
                action={async () => {
                  "use server";

                  await updateCartoonStatus(
                    cartoon.id,
                    "published"
                  );
                }}
              >
                <button
                  type="submit"
                  className="cartoons-save-button"
                >
                  Publish Cartoon
                </button>
              </form>
            )}

          </div>

          {status === "approved" &&
            !cartoon.image_url && (
              <p
                style={{
                  margin: "18px 0 0",
                  color: "#8a4141",
                  fontSize: "10px",
                  lineHeight: "1.5",
                }}
              >
                Generate the AI image before publishing
                this cartoon.
              </p>
            )}

        </section>

        {/* =================================================
            CARTOON OF THE DAY
            ================================================= */}

        <section className="cartoons-form-section">

          <div className="cartoons-form-heading">
            <span>07</span>

            <div>
              <h3>
                Cartoon of the Day
              </h3>

              <p>
                Feature one published cartoon prominently
                on the public website.
              </p>
            </div>
          </div>

          {cartoon.is_cartoon_of_day ? (
            <form
              action={async () => {
                "use server";

                await toggleCartoonOfDay(
                  cartoon.id,
                  false
                );
              }}
            >
              <button
                type="submit"
                className="cartoons-secondary-button"
              >
                Remove from Cartoon of the Day
              </button>
            </form>
          ) : (
            <form
              action={async () => {
                "use server";

                await toggleCartoonOfDay(
                  cartoon.id,
                  true
                );
              }}
            >
              <button
                type="submit"
                className="cartoons-save-button"
                disabled={!canMarkCartoonOfDay}
                style={
                  !canMarkCartoonOfDay
                    ? {
                        opacity: 0.5,
                        cursor: "not-allowed",
                      }
                    : undefined
                }
              >
                Mark as Cartoon of the Day
              </button>
            </form>
          )}

          {!canMarkCartoonOfDay && (
            <p
              style={{
                margin: "12px 0 0",
                color: "#858a8f",
                fontSize: "10px",
                lineHeight: "1.5",
              }}
            >
              Only published cartoons can be selected
              as Cartoon of the Day.
            </p>
          )}

        </section>

        {/* =================================================
            METADATA
            ================================================= */}

        <section className="cartoons-form-section">

          <div className="cartoons-form-heading">
            <span>08</span>

            <div>
              <h3>
                Record information
              </h3>

              <p>
                Editorial record and publication timestamps.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, minmax(0, 1fr))",
              gap: "1px",
              border: "1px solid #e1e3e4",
              background: "#e1e3e4",
            }}
          >

            <div
              style={{
                padding: "16px",
                background: "#fafafa",
              }}
            >
              <span
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#858a8f",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                }}
              >
                CREATED
              </span>

              <strong
                style={{
                  color: "#34373a",
                  fontSize: "10px",
                }}
              >
                {formatDate(
                  cartoon.created_at
                )}
              </strong>
            </div>

            <div
              style={{
                padding: "16px",
                background: "#fafafa",
              }}
            >
              <span
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#858a8f",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                }}
              >
                LAST UPDATED
              </span>

              <strong
                style={{
                  color: "#34373a",
                  fontSize: "10px",
                }}
              >
                {formatDate(
                  cartoon.updated_at
                )}
              </strong>
            </div>

            <div
              style={{
                padding: "16px",
                background: "#fafafa",
              }}
            >
              <span
                style={{
                  display: "block",
                  marginBottom: "7px",
                  color: "#858a8f",
                  fontSize: "8px",
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                }}
              >
                PUBLISHED
              </span>

              <strong
                style={{
                  color: "#34373a",
                  fontSize: "10px",
                }}
              >
                {formatDate(
                  cartoon.published_at
                )}
              </strong>
            </div>

          </div>

        </section>

      </section>
    </main>
  );
}

    /* =========================================================
    PAGE
    ========================================================= */

    async function CartoonManagementRoute({
    params,
    }: {
    params: Promise<{ id: string }>;
    }) {
    const { id } = await params;

    return (
        <CartoonManagementContent id={id} />
    );
    }

    export default function CartoonManagementPage({
    params,
    }: {
    params: Promise<{ id: string }>;
    }) {
    return (
        <Suspense
        fallback={
            <CartoonManagementLoading />
        }
        >
        <CartoonManagementRoute params={params} />
        </Suspense>
    );
    }