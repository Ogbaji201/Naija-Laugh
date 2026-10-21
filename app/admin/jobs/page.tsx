import { Suspense } from "react";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import "./jobs.css";

type Job = {
  id: string;
  title: string;
  slug: string;
  company_name: string;
  category: string | null;
  experience_level: string | null;
  employment_type: string | null;
  work_type: string | null;
  location: string | null;
  status: string;
  ai_review_status: string | null;
  ai_confidence: number | null;
  featured: boolean;
  application_deadline: string | null;
  created_at: string;
};

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatAIReviewStatus(status: string | null) {
  if (!status || status === "pending") {
    return "Pending";
  }

  if (status === "reviewed") {
    return "Reviewed";
  }

  if (status === "flagged") {
    return "Flagged";
  }

  if (status === "rejected") {
    return "Rejected";
  }

  return status;
}

async function JobsAdminContent() {
  const supabase = createAdminClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      `
        id,
        title,
        slug,
        company_name,
        category,
        experience_level,
        employment_type,
        work_type,
        location,
        status,
        ai_review_status,
        ai_confidence,
        featured,
        application_deadline,
        created_at
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin jobs error:", error);
  }

  const allJobs = (jobs || []) as Job[];

  const pendingJobs = allJobs.filter(
    (job) => job.status === "pending"
  );

  const reviewJobs = allJobs.filter(
    (job) => job.status === "review"
  );

  const approvedJobs = allJobs.filter(
    (job) => job.status === "approved"
  );

  const publishedJobs = allJobs.filter(
    (job) => job.status === "published"
  );

  const rejectedJobs = allJobs.filter(
    (job) => job.status === "rejected"
  );

  const expiredJobs = allJobs.filter(
    (job) => job.status === "expired"
  );

  return (
    <div className="jobs-admin-page">
      <div className="jobs-admin-header">
        <div>
          <span className="admin-section-kicker">
            CAREER DESK
          </span>

          <h1>Jobs</h1>

          <p>
            Manage career opportunities published on
            NaijaLaughs.
          </p>
        </div>

        <Link
          href="/admin/jobs/new"
          className="jobs-admin-primary-button"
        >
          + Add Job
        </Link>
      </div>

      {/* Dashboard statistics */}

      <div className="jobs-admin-stats">
        <div className="jobs-admin-stat">
          <span>Total Jobs</span>
          <strong>{allJobs.length}</strong>
        </div>

        <div className="jobs-admin-stat">
          <span>Pending</span>
          <strong>{pendingJobs.length}</strong>
        </div>

        <div className="jobs-admin-stat">
          <span>Under Review</span>
          <strong>{reviewJobs.length}</strong>
        </div>

        <div className="jobs-admin-stat">
          <span>Approved</span>
          <strong>{approvedJobs.length}</strong>
        </div>

        <div className="jobs-admin-stat">
          <span>Published</span>
          <strong>{publishedJobs.length}</strong>
        </div>

        <div className="jobs-admin-stat">
          <span>Rejected</span>
          <strong>{rejectedJobs.length}</strong>
        </div>

        <div className="jobs-admin-stat">
          <span>Expired</span>
          <strong>{expiredJobs.length}</strong>
        </div>
      </div>

      <section className="jobs-admin-panel">
        <div className="jobs-admin-panel-header">
          <div>
            <span className="admin-section-kicker">
              OPPORTUNITIES
            </span>

            <h2>Job Listings</h2>
          </div>

          <span className="jobs-admin-count">
            {allJobs.length}{" "}
            {allJobs.length === 1
              ? "listing"
              : "listings"}
          </span>
        </div>

        {allJobs.length === 0 ? (
          <div className="jobs-admin-empty">
            <span>NO JOBS YET</span>

            <h3>
              Start building the Career Desk.
            </h3>

            <p>
              Create your first job opportunity and
              publish it to the NaijaLaughs Jobs
              section.
            </p>

            <Link
              href="/admin/jobs/new"
              className="jobs-admin-primary-button"
            >
              Create First Job
            </Link>
          </div>
        ) : (
          <div className="jobs-admin-table-wrap">
            <table className="jobs-admin-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>AI Review</th>
                  <th>Status</th>
                  <th>Deadline</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {allJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="jobs-admin-job-title">
                        <strong>{job.title}</strong>

                        {job.featured && (
                          <span className="jobs-admin-featured">
                            FEATURED
                          </span>
                        )}

                        <small>
                          {job.category ||
                            "Uncategorised"}
                        </small>
                      </div>
                    </td>

                    <td>
                      {job.company_name}
                    </td>

                    <td>
                      {job.location || "Nigeria"}
                    </td>

                    <td>
                      {job.work_type ||
                        job.employment_type ||
                        "—"}
                    </td>

                    <td>
                      <div className="jobs-admin-ai-table-status">
                        <span
                          className={`jobs-admin-ai-table-badge ai-${job.ai_review_status || "pending"}`}
                        >
                          {formatAIReviewStatus(
                            job.ai_review_status
                          )}
                        </span>

                        {job.ai_confidence !== null && (
                          <small>
                            {job.ai_confidence}%
                          </small>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`jobs-admin-status status-${job.status}`}
                      >
                        {job.status}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        job.application_deadline
                      )}
                    </td>

                    <td>
                      <Link
                        href={`/admin/jobs/${job.id}`}
                        className="jobs-admin-view"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function JobsAdminLoading() {
  return (
    <div className="jobs-admin-page">
      <div className="jobs-admin-loading">
        <span>CAREER DESK</span>

        <h1>Loading Jobs...</h1>

        <p>
          Preparing the job management workspace.
        </p>
      </div>
    </div>
  );
}

export default function AdminJobsPage() {
  return (
    <Suspense fallback={<JobsAdminLoading />}>
      <JobsAdminContent />
    </Suspense>
  );
}