import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";


/* =========================================================
   TYPES
   ========================================================= */

type DashboardStats = {
  publishedArticles: number;
  pendingReview: number;
  allDrafts: number;
  publishedJobs: number;
  pendingJobs: number;
  totalArticles: number;
  cartoons: number;
  trendingTopics: number;
};


/* =========================================================
   DASHBOARD DATA
   ========================================================= */

async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();

  const [
    publishedArticlesResult,
    pendingReviewResult,
    allDraftsResult,
    publishedJobsResult,
    pendingJobsResult,
    totalArticlesResult,
    cartoonsResult,
    trendingTopicsResult,
  ] = await Promise.all([
    supabase
      .from("articles")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

    supabase
      .from("drafts")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "needs_review"),

    supabase
      .from("drafts")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("jobs")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "published"),

    supabase
      .from("jobs")
      .select("id", {
        count: "exact",
        head: true,
      })
      .in("status", ["pending", "review"]),

    supabase
      .from("articles")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("cartoons")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("trending_topics")
      .select("id", {
        count: "exact",
        head: true,
      }),
  ]);

  return {
    publishedArticles:
      publishedArticlesResult.count ?? 0,

    pendingReview:
      pendingReviewResult.count ?? 0,

    allDrafts:
      allDraftsResult.count ?? 0,

    publishedJobs:
      publishedJobsResult.count ?? 0,

    pendingJobs:
      pendingJobsResult.count ?? 0,

    totalArticles:
      totalArticlesResult.count ?? 0,

    cartoons:
      cartoonsResult.count ?? 0,

    trendingTopics:
      trendingTopicsResult.count ?? 0,
  };
}


/* =========================================================
   DASHBOARD CONTENT
   ========================================================= */

async function DashboardContent() {
  const stats = await getDashboardStats();

  return (
    <main className="admin-main-content">

      {/* ===================================================
          INTRODUCTION
          =================================================== */}

      <section className="admin-introduction">

        <div>

          <span className="admin-breadcrumb">
            WORKSPACE / DASHBOARD
          </span>

          <h2>
            Good to see you.
          </h2>

          <p>
            Here&apos;s an overview of your NaijaLaughs
            publishing workspace.
          </p>

        </div>


        <Link
          href="/admin/news?status=needs_review"
          className="admin-review-alert"
        >

          <span className="alert-dot" />

          <div>

            <strong>
              Review News
            </strong>

            <small>
              Open the editorial review queue
            </small>

          </div>

          <span>
            →
          </span>

        </Link>

      </section>


      {/* ===================================================
          CONTENT PERFORMANCE
          =================================================== */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>

            <span>
              OVERVIEW
            </span>

            <h2>
              Content performance
            </h2>

          </div>

        </div>


        <div className="admin-stat-grid">

          {/* PUBLISHED ARTICLES */}

          <Link
            href="/admin/news?status=published"
            className="admin-stat-card"
          >

            <div className="admin-stat-top">

              <span className="admin-stat-code">
                PA
              </span>

            </div>

            <strong>
              {stats.publishedArticles}
            </strong>

            <span className="admin-stat-label">
              Published Articles
            </span>

          </Link>


          {/* PENDING REVIEW */}

          <Link
            href="/admin/news?status=needs_review"
            className={
              stats.pendingReview > 0
                ? "admin-stat-card is-highlighted"
                : "admin-stat-card"
            }
          >

            <div className="admin-stat-top">

              <span className="admin-stat-code">
                PR
              </span>

              {stats.pendingReview > 0 && (
                <span className="stat-attention">
                  ACTION
                </span>
              )}

            </div>

            <strong>
              {stats.pendingReview}
            </strong>

            <span className="admin-stat-label">
              Pending Review
            </span>

          </Link>


          {/* ALL DRAFTS */}

          <Link
            href="/admin/news?status=all"
            className="admin-stat-card"
          >

            <div className="admin-stat-top">

              <span className="admin-stat-code">
                DR
              </span>

            </div>

            <strong>
              {stats.allDrafts}
            </strong>

            <span className="admin-stat-label">
              All Drafts
            </span>

          </Link>


          {/* PUBLISHED JOBS */}

          <Link
            href="/admin/jobs"
            className="admin-stat-card"
          >

            <div className="admin-stat-top">

              <span className="admin-stat-code">
                JB
              </span>

            </div>

            <strong>
              {stats.publishedJobs}
            </strong>

            <span className="admin-stat-label">
              Published Jobs
            </span>

          </Link>


          {/* JOBS PENDING */}

          <Link
            href="/admin/jobs"
            className={
              stats.pendingJobs > 0
                ? "admin-stat-card is-highlighted"
                : "admin-stat-card"
            }
          >

            <div className="admin-stat-top">

              <span className="admin-stat-code">
                JP
              </span>

              {stats.pendingJobs > 0 && (
                <span className="stat-attention">
                  ACTION
                </span>
              )}

            </div>

            <strong>
              {stats.pendingJobs}
            </strong>

            <span className="admin-stat-label">
              Jobs Pending
            </span>

          </Link>


          {/* TOTAL ARTICLES */}

          <Link
            href="/admin/news?status=published"
            className="admin-stat-card"
          >

            <div className="admin-stat-top">

              <span className="admin-stat-code">
                AR
              </span>

            </div>

            <strong>
              {stats.totalArticles}
            </strong>

            <span className="admin-stat-label">
              Total Articles
            </span>

          </Link>


          {/* CARTOONS */}

          <Link
            href="/admin/cartoons"
            className="admin-stat-card"
          >

            <div className="admin-stat-top">

              <span className="admin-stat-code">
                CT
              </span>

            </div>

            <strong>
              {stats.cartoons}
            </strong>

            <span className="admin-stat-label">
              Cartoons
            </span>

          </Link>


          {/* TRENDING */}

          <Link
            href="/admin/trending"
            className="admin-stat-card"
          >

            <div className="admin-stat-top">

              <span className="admin-stat-code">
                TR
              </span>

            </div>

            <strong>
              {stats.trendingTopics}
            </strong>

            <span className="admin-stat-label">
              Trending Topics
            </span>

          </Link>

        </div>

      </section>


      {/* ===================================================
          QUICK ACCESS
          =================================================== */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>

            <span>
              QUICK ACCESS
            </span>

            <h2>
              Editorial workspace
            </h2>

          </div>

        </div>


        <div className="admin-actions-grid">

          <Link
            href="/admin/news?status=needs_review"
            className="admin-action-card"
          >

            <span className="admin-action-number">
              01
            </span>

            <div>

              <h3>
                Review News
              </h3>

              <p>
                Review AI-generated stories before
                publication.
              </p>

            </div>

            <span className="admin-action-arrow">
              →
            </span>

          </Link>


          <Link
            href="/admin/jobs"
            className="admin-action-card"
          >

            <span className="admin-action-number">
              02
            </span>

            <div>

              <h3>
                Manage Jobs
              </h3>

              <p>
                Review and manage opportunities
                submitted for publication.
              </p>

            </div>

            <span className="admin-action-arrow">
              →
            </span>

          </Link>


          <Link
            href="/admin/cartoons"
            className="admin-action-card"
          >

            <span className="admin-action-number">
              03
            </span>

            <div>

              <h3>
                Manage Cartoons
              </h3>

              <p>
                Create, review and publish AI-generated
                editorial cartoons.
              </p>

            </div>

            <span className="admin-action-arrow">
              →
            </span>

          </Link>


          <Link
            href="/admin/trending"
            className="admin-action-card"
          >

            <span className="admin-action-number">
              04
            </span>

            <div>

              <h3>
                Manage Trending
              </h3>

              <p>
                Manage the topics currently driving
                conversation on NaijaLaughs.
              </p>

            </div>

            <span className="admin-action-arrow">
              →
            </span>

          </Link>

        </div>

      </section>


      {/* ===================================================
          EDITORIAL PIPELINE
          =================================================== */}

      <section className="admin-section">

        <div className="admin-section-heading">

          <div>

            <span>
              WORKFLOW
            </span>

            <h2>
              Editorial pipeline
            </h2>

          </div>

        </div>


        <div className="editorial-pipeline">

          <div className="pipeline-step">

            <span>
              01
            </span>

            <strong>
              Intake
            </strong>

            <small>
              News enters the newsroom
            </small>

          </div>


          <div className="pipeline-line" />


          <div className="pipeline-step">

            <span>
              02
            </span>

            <strong>
              AI Draft
            </strong>

            <small>
              Story prepared for review
            </small>

          </div>


          <div className="pipeline-line" />


          <div className="pipeline-step">

            <span>
              03
            </span>

            <strong>
              Editorial Review
            </strong>

            <small>
              Human decision before publishing
            </small>

          </div>


          <div className="pipeline-line" />


          <div className="pipeline-step">

            <span>
              04
            </span>

            <strong>
              Published
            </strong>

            <small>
              Live on NaijaLaughs
            </small>

          </div>

        </div>

      </section>

    </main>
  );
}


/* =========================================================
   LOADING
   ========================================================= */

function DashboardLoading() {
  return (
    <main className="admin-main-content">

      <section className="admin-loading">

        <span className="admin-loading-line" />

        <h1>
          Loading dashboard
        </h1>

        <p>
          Retrieving your publishing workspace...
        </p>

      </section>

    </main>
  );
}


/* =========================================================
   PAGE
   ========================================================= */

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>

      <DashboardContent />

    </Suspense>
  );
}