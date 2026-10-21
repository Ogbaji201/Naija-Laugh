import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";


type Draft = {
  id: string;
  story_id: string | null;
  version: number;
  headline: string;
  standfirst: string | null;
  body: string | null;
  why_it_matters: string | null;
  what_is_not_clear: string | null;
  what_happens_next: string | null;
  model: string | null;
  prompt_version: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type NewsStatus =
  | "needs_review"
  | "draft"
  | "published"
  | "rejected"
  | "all";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* =========================================================
   SAVE EDITORIAL CHANGES
   ========================================================= */

async function saveDraftChanges(formData: FormData) {
  "use server";

  const draftId = String(
    formData.get("draft_id") || ""
  ).trim();

  const headline = String(
    formData.get("headline") || ""
  ).trim();

  const standfirst = String(
    formData.get("standfirst") || ""
  ).trim();

  const body = String(
    formData.get("body") || ""
  ).trim();

  const whyItMatters = String(
    formData.get("why_it_matters") || ""
  ).trim();

  const whatIsNotClear = String(
    formData.get("what_is_not_clear") || ""
  ).trim();

  const whatHappensNext = String(
    formData.get("what_happens_next") || ""
  ).trim();

  if (!draftId) {
    throw new Error("Draft ID is required.");
  }

  if (!headline || !body) {
    throw new Error(
      "Headline and article body are required."
    );
  }

  const supabase = createAdminClient();

  const {
    data: existingDraft,
    error: existingDraftError,
  } = await supabase
    .from("drafts")
    .select("id, status")
    .eq("id", draftId)
    .single();

  if (existingDraftError || !existingDraft) {
    throw new Error(
      "The selected draft could not be found."
    );
  }

  if (
    existingDraft.status !== "needs_review" &&
    existingDraft.status !== "draft"
  ) {
    throw new Error(
      "Only drafts awaiting editorial review can be edited."
    );
  }

  const { error: updateError } = await supabase
    .from("drafts")
    .update({
      headline,
      standfirst: standfirst || null,
      body,
      why_it_matters:
        whyItMatters || null,
      what_is_not_clear:
        whatIsNotClear || null,
      what_happens_next:
        whatHappensNext || null,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", draftId);

  if (updateError) {
    console.error(
      "Draft editorial update error:",
      updateError
    );

    throw new Error(
      updateError.message
    );
  }

  redirect(
    "/admin/news?status=needs_review"
  );
}

/* =========================================================
   EDITORIAL DECISION
   ========================================================= */

async function decideDraft(formData: FormData) {
  "use server";

  const draftId = String(
    formData.get("draft_id") || ""
  ).trim();

  const decision = String(
    formData.get("decision") || ""
  ).trim();

  const notes = String(
    formData.get("notes") || ""
  ).trim();

  if (!draftId) {
    throw new Error("Draft ID is required.");
  }

  if (
    decision !== "approve" &&
    decision !== "reject" &&
    decision !== "hold"
  ) {
    throw new Error("Invalid editorial decision.");
  }

  const supabase = createAdminClient();

  const {
    data: draft,
    error: draftError,
  } = await supabase
    .from("drafts")
    .select(`
      id,
      story_id,
      version,
      headline,
      standfirst,
      body,
      why_it_matters,
      what_is_not_clear,
      what_happens_next,
      model,
      prompt_version,
      status,
      created_at,
      updated_at
    `)
    .eq("id", draftId)
    .single();

  if (draftError || !draft) {
    console.error(
      "Draft fetch error:",
      draftError
    );

    throw new Error(
      "The selected draft could not be found."
    );
  }

  /* =======================================================
     LOAD STORY CATEGORY
     ======================================================= */

  let categoryId: string | null = null;

  if (draft.story_id) {
    const {
      data: story,
      error: storyError,
    } = await supabase
      .from("stories")
      .select("category_id")
      .eq("id", draft.story_id)
      .maybeSingle();

    if (storyError) {
      console.error(
        "Story category lookup error:",
        storyError
      );

      throw new Error(
        storyError.message
      );
    }

    categoryId = story?.category_id ?? null;
  }

  /* =======================================================
     SAVE EDITORIAL REVIEW
     ======================================================= */

  const {
    error: reviewError,
  } = await supabase
    .from("editorial_reviews")
    .insert({
      draft_id: draftId,
      decision,
      notes: notes || null,
      reviewed_by: null,
    });

  if (reviewError) {
    console.error(
      "Editorial review error:",
      reviewError
    );

    throw new Error(
      reviewError.message
    );
  }

  /* =======================================================
     APPROVE + PUBLISH
     ======================================================= */

  if (decision === "approve") {
    if (!draft.body || !draft.headline) {
      throw new Error(
        "The draft must contain a headline and body before it can be published."
      );
    }

    const baseSlug = slugify(
      draft.headline
    );

    const slug = `${baseSlug}-${draft.id.slice(
      0,
      8
    )}`;

    const {
      data: existingArticle,
      error: existingArticleError,
    } = await supabase
      .from("articles")
      .select("id")
      .eq("draft_id", draftId)
      .maybeSingle();

    if (existingArticleError) {
      console.error(
        "Existing article lookup error:",
        existingArticleError
      );

      throw new Error(
        existingArticleError.message
      );
    }

    if (existingArticle) {
      const {
        error: articleUpdateError,
      } = await supabase
        .from("articles")
        .update({
          headline: draft.headline,
          standfirst:
            draft.standfirst || null,
          body: draft.body,
          category_id: categoryId,
          slug,
          status: "published",
          published_at:
            new Date().toISOString(),
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", existingArticle.id);

      if (articleUpdateError) {
        console.error(
          "Article update error:",
          articleUpdateError
        );

        throw new Error(
          articleUpdateError.message
        );
      }
    } else {
      const {
        error: articleInsertError,
      } = await supabase
        .from("articles")
        .insert({
          draft_id: draftId,
          headline: draft.headline,
          standfirst:
            draft.standfirst || null,
          body: draft.body,
          category_id: categoryId,
          slug,
          status: "published",
          published_at:
            new Date().toISOString(),
        });

      if (articleInsertError) {
        console.error(
          "Article insert error:",
          articleInsertError
        );

        throw new Error(
          articleInsertError.message
        );
      }
    }

    const {
      error: publishDraftError,
    } = await supabase
      .from("drafts")
      .update({
        status: "published",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", draftId);

    if (publishDraftError) {
      console.error(
        "Draft publish update error:",
        publishDraftError
      );

      throw new Error(
        publishDraftError.message
      );
    }
  }

  /* =======================================================
     REJECT
     ======================================================= */

  if (decision === "reject") {
    const {
      error: rejectError,
    } = await supabase
      .from("drafts")
      .update({
        status: "rejected",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", draftId);

    if (rejectError) {
      console.error(
        "Draft reject update error:",
        rejectError
      );

      throw new Error(
        rejectError.message
      );
    }
  }

  /* =======================================================
     HOLD
     ======================================================= */

  if (decision === "hold") {
    const {
      error: holdError,
    } = await supabase
      .from("drafts")
      .update({
        status: "needs_review",
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", draftId);

    if (holdError) {
      console.error(
        "Draft hold update error:",
        holdError
      );

      throw new Error(
        holdError.message
      );
    }
  }

  redirect(
    "/admin/news?status=needs_review"
  );
}

/* =========================================================
   STATUS HELPERS
   ========================================================= */

function getStatusLabel(
  status: string
) {
  switch (status) {
    case "needs_review":
      return "Pending Review";

    case "draft":
      return "Draft";

    case "published":
      return "Published";

    case "rejected":
      return "Rejected";

    default:
      return status;
  }
}

function getStatusClass(
  status: string
) {
  switch (status) {
    case "needs_review":
      return "news-status pending";

    case "draft":
      return "news-status draft";

    case "published":
      return "news-status published";

    case "rejected":
      return "news-status rejected";

    default:
      return "news-status";
  }
}

/* =========================================================
   NEWS CONTENT
   ========================================================= */

async function NewsPageContent({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
  }>;
}) {
  const params = await searchParams;

  const requestedStatus =
    params.status || "needs_review";

  const allowedStatuses: NewsStatus[] = [
    "needs_review",
    "draft",
    "published",
    "rejected",
    "all",
  ];

  const status: NewsStatus =
    allowedStatuses.includes(
      requestedStatus as NewsStatus
    )
      ? (requestedStatus as NewsStatus)
      : "needs_review";

  const supabase = createAdminClient();

  let query = supabase
    .from("drafts")
    .select(`
      id,
      story_id,
      version,
      headline,
      standfirst,
      body,
      why_it_matters,
      what_is_not_clear,
      what_happens_next,
      model,
      prompt_version,
      status,
      created_at,
      updated_at
    `)
    .order("updated_at", {
      ascending: false,
    });

  if (status !== "all") {
    query = query.eq(
      "status",
      status
    );
  }

  const {
    data: drafts,
    error,
  } = await query;

  if (error) {
    console.error(
      "Drafts fetch error:",
      error
    );
  }

  const newsDrafts =
    (drafts ?? []) as Draft[];

  return (
    <main className="admin-main-content">
      <div className="news-review-page">

        {/* =================================================
            PAGE HEADER
            ================================================= */}

        <div className="news-page-header">

          <div>
            <div className="page-eyebrow">
              NEWSROOM / REVIEW
            </div>

            <h1>
              News Review
            </h1>

            <p>
              Review AI-generated stories before
              they are published to NaijaLaughs.
            </p>
          </div>

          <div className="news-page-header-actions">

            <Link
              href="/admin/news/intake"
              className="secondary-admin-button"
            >
              + News Intake
            </Link>

            <Link
              href="/admin/news/sources"
              className="secondary-admin-button"
            >
              Sources
            </Link>

          </div>

        </div>


        {/* =================================================
            STATUS TABS
            ================================================= */}

        <div className="news-status-tabs">

          <Link
            href="/admin/news?status=needs_review"
            className={
              status === "needs_review"
                ? "news-status-tab active"
                : "news-status-tab"
            }
          >
            Pending Review
          </Link>

          <Link
            href="/admin/news?status=draft"
            className={
              status === "draft"
                ? "news-status-tab active"
                : "news-status-tab"
            }
          >
            Drafts
          </Link>

          <Link
            href="/admin/news?status=published"
            className={
              status === "published"
                ? "news-status-tab active"
                : "news-status-tab"
            }
          >
            Published
          </Link>

          <Link
            href="/admin/news?status=rejected"
            className={
              status === "rejected"
                ? "news-status-tab active"
                : "news-status-tab"
            }
          >
            Rejected
          </Link>

          <Link
            href="/admin/news?status=all"
            className={
              status === "all"
                ? "news-status-tab active"
                : "news-status-tab"
            }
          >
            All
          </Link>

        </div>


        {/* =================================================
            QUEUE SUMMARY
            ================================================= */}

        <div className="news-review-summary">

          <div>
            <span>
              CURRENT QUEUE
            </span>

            <strong>
              {newsDrafts.length}
            </strong>
          </div>

          <div>
            <span>
              STATUS
            </span>

            <strong>
              {getStatusLabel(status)}
            </strong>
          </div>

        </div>


        {/* =================================================
            EMPTY STATE
            ================================================= */}

        {newsDrafts.length === 0 ? (

          <section className="admin-panel">

            <div className="admin-empty-state">

              <div className="admin-empty-number">
                00
              </div>

              <h2>
                No stories in this queue
              </h2>

              <p>
                There are currently no drafts matching
                the selected newsroom status.
              </p>

              {status === "needs_review" && (
                <Link
                  href="/admin/news/intake"
                  className="primary-admin-button"
                >
                  Add News Intake
                </Link>
              )}

            </div>

          </section>

        ) : (

          /* =================================================
             DRAFT REVIEW LIST
             ================================================= */

          <div className="news-review-list">

            {newsDrafts.map(
              (draft) => (

                <article
                  key={draft.id}
                  className="news-review-card"
                >

                  {/* =======================================
                      CARD HEADER
                      ======================================= */}

                  <div className="news-review-card-header">

                    <div>

                      <div className="news-review-meta">

                        <span
                          className={getStatusClass(
                            draft.status
                          )}
                        >
                          {getStatusLabel(
                            draft.status
                          )}
                        </span>

                        <span>
                          Version {draft.version}
                        </span>

                        <span>
                          Updated{" "}
                          {formatDate(
                            draft.updated_at
                          )}
                        </span>

                      </div>

                      <h2>
                        {draft.headline}
                      </h2>

                    </div>

                  </div>


                  {/* =======================================
                      STORY METADATA
                      ======================================= */}

                  <div className="news-review-details">

                    <div>
                      <span>
                        STORY ID
                      </span>

                      <strong>
                        {draft.story_id ||
                          "Not assigned"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        MODEL
                      </span>

                      <strong>
                        {draft.model ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        PROMPT VERSION
                      </span>

                      <strong>
                        {draft.prompt_version ||
                          "Not specified"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        CREATED
                      </span>

                      <strong>
                        {formatDate(
                          draft.created_at
                        )}
                      </strong>
                    </div>

                  </div>


                  {/* =======================================
                      EDITORIAL EDITOR
                      ======================================= */}

                  {(
                    draft.status === "needs_review" ||
                    draft.status === "draft"
                  ) ? (

                    <form
                      action={saveDraftChanges}
                      className="editorial-review-form news-editorial-edit-form"
                    >

                      <input
                        type="hidden"
                        name="draft_id"
                        value={draft.id}
                      />

                      <div className="news-review-section">
                        <div className="news-review-section-label">
                          HEADLINE
                        </div>

                        <input
                          name="headline"
                          defaultValue={draft.headline}
                          className="news-editorial-input"
                          required
                        />
                      </div>

                      <div className="news-review-section">
                        <div className="news-review-section-label">
                          STANDFIRST
                        </div>

                        <textarea
                          name="standfirst"
                          defaultValue={draft.standfirst ?? ""}
                          rows={3}
                          className="news-editorial-textarea"
                        />
                      </div>

                      <div className="news-review-section">
                        <div className="news-review-section-label">
                          STORY
                        </div>

                        <textarea
                          name="body"
                          defaultValue={draft.body ?? ""}
                          rows={16}
                          className="news-editorial-textarea news-editorial-body"
                          required
                        />
                      </div>

                      <div className="news-review-context-grid">

                        <section className="news-review-context-card">
                          <span>
                            WHY IT MATTERS
                          </span>

                          <textarea
                            name="why_it_matters"
                            defaultValue={
                              draft.why_it_matters ?? ""
                            }
                            rows={5}
                            className="news-editorial-textarea"
                          />
                        </section>

                        <section className="news-review-context-card">
                          <span>
                            WHAT IS NOT CLEAR
                          </span>

                          <textarea
                            name="what_is_not_clear"
                            defaultValue={
                              draft.what_is_not_clear ?? ""
                            }
                            rows={5}
                            className="news-editorial-textarea"
                          />
                        </section>

                        <section className="news-review-context-card">
                          <span>
                            WHAT HAPPENS NEXT
                          </span>

                          <textarea
                            name="what_happens_next"
                            defaultValue={
                              draft.what_happens_next ?? ""
                            }
                            rows={5}
                            className="news-editorial-textarea"
                          />
                        </section>

                      </div>

                      <div className="news-editorial-save-bar">
                        <div>
                          <strong>
                            Editorial editing
                          </strong>

                          <span>
                            Make factual or editorial corrections before making a decision.
                          </span>
                        </div>

                        <button
                          type="submit"
                          className="primary-admin-button"
                        >
                          Save Changes
                        </button>
                      </div>

                    </form>

                  ) : (

                    <>
                      {draft.standfirst && (
                        <section className="news-review-section">
                          <div className="news-review-section-label">
                            STANDFIRST
                          </div>

                          <p className="news-review-standfirst">
                            {draft.standfirst}
                          </p>
                        </section>
                      )}

                      {draft.body && (
                        <section className="news-review-section">
                          <div className="news-review-section-label">
                            STORY
                          </div>

                          <div className="news-review-body">
                            {draft.body
                              .split("\n")
                              .map(
                                (
                                  paragraph,
                                  index
                                ) =>
                                  paragraph.trim() ? (
                                    <p key={index}>
                                      {paragraph}
                                    </p>
                                  ) : null
                              )}
                          </div>
                        </section>
                      )}

                      <div className="news-review-context-grid">

                        {draft.why_it_matters && (
                          <section className="news-review-context-card">
                            <span>
                              WHY IT MATTERS
                            </span>

                            <p>
                              {draft.why_it_matters}
                            </p>
                          </section>
                        )}

                        {draft.what_is_not_clear && (
                          <section className="news-review-context-card">
                            <span>
                              WHAT IS NOT CLEAR
                            </span>

                            <p>
                              {draft.what_is_not_clear}
                            </p>
                          </section>
                        )}

                        {draft.what_happens_next && (
                          <section className="news-review-context-card">
                            <span>
                              WHAT HAPPENS NEXT
                            </span>

                            <p>
                              {draft.what_happens_next}
                            </p>
                          </section>
                        )}

                      </div>
                    </>
                  )}


                  {/* =======================================
                      REVIEW ACTIONS
                      ======================================= */}

                  {draft.status === "needs_review" && (

                    <section className="news-review-actions">

                      <div className="news-review-actions-header">

                        <div>

                          <div className="news-review-section-label">
                            EDITORIAL DECISION
                          </div>

                          <p>
                            Review the story and choose
                            the appropriate newsroom action.
                          </p>

                        </div>

                      </div>


                      <form
                        action={decideDraft}
                        className="news-review-form"
                      >

                        <input
                          type="hidden"
                          name="draft_id"
                          value={draft.id}
                        />

                        <div className="news-review-notes">

                          <label htmlFor={`notes-${draft.id}`}>
                            Editorial Notes
                          </label>

                          <textarea
                            id={`notes-${draft.id}`}
                            name="notes"
                            rows={4}
                            placeholder="Add editorial notes, corrections or reasons for the decision..."
                          />

                        </div>


                        <div className="news-review-buttons">

                          <button
                            type="submit"
                            name="decision"
                            value="hold"
                            className="secondary-admin-button"
                          >
                            Hold
                          </button>

                          <button
                            type="submit"
                            name="decision"
                            value="reject"
                            className="news-reject-button"
                          >
                            Reject
                          </button>

                          <button
                            type="submit"
                            name="decision"
                            value="approve"
                            className="primary-admin-button"
                          >
                            Approve & Publish
                          </button>

                        </div>

                      </form>

                    </section>

                  )}

                </article>

              )
            )}

          </div>

        )}

      </div>
    </main>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function NewsPageLoading() {
  return (
    <main className="admin-main-content">

      <section className="news-loading">

        <span />

        <h1>
          Loading newsroom
        </h1>

        <p>
          Retrieving editorial drafts...
        </p>

      </section>

    </main>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <NewsPageLoading />
      }
    >
      <NewsPageContent
        searchParams={searchParams}
      />
    </Suspense>
  );
}