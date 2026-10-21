import { Suspense } from "react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import "../jobs.css";
import JobAIReview from "./JobAIReview";
import PublishJob from "./PublishJob";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const CATEGORY_OPTIONS = [
  "Nigeria",
  "Africa",
  "Business",
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Engineering",
  "Marketing",
  "Sales",
  "Customer Service",
  "Human Resources",
  "Media & Communications",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "Entry Level",
  "Junior",
  "Mid Level",
  "Senior",
  "Lead",
  "Manager",
  "Executive",
];

const EMPLOYMENT_OPTIONS = [
  "Full Time",
  "Part Time",
  "Contract",
  "Temporary",
  "Internship",
  "Freelance",
];

const WORK_TYPE_OPTIONS = [
  "On-site",
  "Hybrid",
  "Remote",
];

type Job = {
  id: string;
  title: string;
  slug: string;
  company_name: string;
  company_logo_url: string | null;
  category: string | null;
  experience_level: string | null;
  employment_type: string | null;
  work_type: string | null;
  location: string | null;
  country: string | null;
  summary: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  date_posted: string | null;
  application_deadline: string | null;
  application_url: string;
  source_url: string | null;
  source_name: string | null;
  status: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

function formatDateForInput(date: string | null) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
}

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function getUniqueSlug(
  supabase: ReturnType<typeof createAdminClient>,
  title: string,
  currentId: string,
  currentSlug: string
) {
  const baseSlug = createSlug(title);

  if (baseSlug === currentSlug) {
    return currentSlug;
  }

  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const { data, error } = await supabase
      .from("jobs")
      .select("id")
      .eq("slug", slug)
      .neq("id", currentId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to check job slug: ${error.message}`
      );
    }

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

/* =========================================================
   UPDATE JOB
   ========================================================= */

async function updateJob(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Job ID is missing.");
  }

  const supabase = createAdminClient();

  const { data: existingJob, error: existingError } =
    await supabase
      .from("jobs")
      .select("id, slug, title")
      .eq("id", id)
      .maybeSingle();

  if (existingError || !existingJob) {
    throw new Error("Job could not be found.");
  }

  const title = String(
    formData.get("title") || ""
  ).trim();

  const companyName = String(
    formData.get("company_name") || ""
  ).trim();

  const applicationUrl = String(
    formData.get("application_url") || ""
  ).trim();

  if (!title) {
    throw new Error("Job title is required.");
  }

  if (!companyName) {
    throw new Error("Company name is required.");
  }

  if (!applicationUrl) {
    throw new Error("Application URL is required.");
  }

  const status = String(
    formData.get("status") || "pending"
  );

  const allowedStatuses = [
    "pending",
    "review",
    "approved",
    "published",
    "rejected",
    "expired",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid job status.");
  }

  const slug = await getUniqueSlug(
    supabase,
    title,
    id,
    existingJob.slug
  );

  const salaryMinValue = String(
    formData.get("salary_min") || ""
  );

  const salaryMaxValue = String(
    formData.get("salary_max") || ""
  );

  const deadlineValue = String(
    formData.get("application_deadline") || ""
  );

  const { error } = await supabase
    .from("jobs")
    .update({
      title,
      slug,

      company_name: companyName,

      company_logo_url:
        String(formData.get("company_logo_url") || "").trim() ||
        null,

      category:
        String(formData.get("category") || "").trim() ||
        null,

      experience_level:
        String(
          formData.get("experience_level") || ""
        ).trim() || null,

      employment_type:
        String(
          formData.get("employment_type") || ""
        ).trim() || null,

      work_type:
        String(formData.get("work_type") || "").trim() ||
        null,

      location:
        String(formData.get("location") || "").trim() ||
        null,

      country:
        String(formData.get("country") || "").trim() ||
        "Nigeria",

      summary:
        String(formData.get("summary") || "").trim() ||
        null,

      description:
        String(formData.get("description") || "").trim() ||
        null,

      requirements:
        String(formData.get("requirements") || "").trim() ||
        null,

      responsibilities:
        String(
          formData.get("responsibilities") || ""
        ).trim() || null,

      salary_min: salaryMinValue
        ? Number(salaryMinValue)
        : null,

      salary_max: salaryMaxValue
        ? Number(salaryMaxValue)
        : null,

      salary_currency:
        String(
          formData.get("salary_currency") || ""
        ).trim() || null,

      application_deadline:
        deadlineValue || null,

      application_url: applicationUrl,

      source_url:
        String(formData.get("source_url") || "").trim() ||
        null,

      source_name:
        String(formData.get("source_name") || "").trim() ||
        null,

      status,

      featured:
        formData.get("featured") === "on",
    })
    .eq("id", id);

  if (error) {
    console.error("Update job error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${slug}`);

  redirect("/admin/jobs");
}

/* =========================================================
   DELETE JOB
   ========================================================= */

async function deleteJob(formData: FormData) {
  "use server";

  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Job ID is missing.");
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete job error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");

  redirect("/admin/jobs");
}

/* =========================================================
   CONTENT
   ========================================================= */

async function JobManageContent({
  id,
}: {
  id: string;
}) {
  const supabase = createAdminClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Manage job error:", error);
  }

  if (!job) {
    notFound();
  }

  const currentJob = job as Job;

  return (
    <div className="jobs-admin-page">
      {/* HEADER */}

      <div className="jobs-admin-header">
        <div>
          <span className="admin-section-kicker">
            CAREER DESK
          </span>

          <h1>Manage Job</h1>

          <p>
            Edit, review and publish this career opportunity.
          </p>
        </div>

        <Link
          href="/admin/jobs"
          className="jobs-admin-secondary-button"
        >
          ← Back to Jobs
        </Link>
      </div>

      {/* JOB SUMMARY */}

      <div className="jobs-admin-manage-summary">
        <div>
          <span className="jobs-admin-manage-kicker">
            CURRENT LISTING
          </span>

          <h2>{currentJob.title}</h2>

          <p>
            {currentJob.company_name}
            {currentJob.location
              ? ` · ${currentJob.location}`
              : ""}
          </p>
        </div>

        <span
          className={`jobs-admin-status status-${currentJob.status}`}
        >
          {currentJob.status}
        </span>
      </div>

      {/* FORM */}

      <form
        action={updateJob}
        className="jobs-admin-form"
      >
        <input
          type="hidden"
          name="id"
          value={currentJob.id}
        />

        {/* JOB INFORMATION */}

        <section className="jobs-admin-form-section">
          <div className="jobs-admin-form-section-heading">
            <span>01</span>

            <div>
              <h2>Job Information</h2>

              <p>
                Basic information about the opportunity and
                employer.
              </p>
            </div>
          </div>

          <div className="jobs-admin-form-grid">
            <div className="jobs-admin-field jobs-admin-field-full">
              <label htmlFor="title">
                Job Title <span>*</span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                defaultValue={currentJob.title}
                required
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="company_name">
                Company Name <span>*</span>
              </label>

              <input
                id="company_name"
                name="company_name"
                type="text"
                defaultValue={currentJob.company_name}
                required
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="company_logo_url">
                Company Logo URL
              </label>

              <input
                id="company_logo_url"
                name="company_logo_url"
                type="url"
                defaultValue={
                  currentJob.company_logo_url || ""
                }
                placeholder="https://..."
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="category">
                Category
              </label>

              <select
                id="category"
                name="category"
                defaultValue={
                  currentJob.category || ""
                }
              >
                <option value="">
                  Select category
                </option>

                {CATEGORY_OPTIONS.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="location">
                Location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                defaultValue={
                  currentJob.location || ""
                }
                placeholder="e.g. Lagos"
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="country">
                Country
              </label>

              <input
                id="country"
                name="country"
                type="text"
                defaultValue={
                  currentJob.country || "Nigeria"
                }
              />
            </div>
          </div>
        </section>

        {/* EMPLOYMENT */}

        <section className="jobs-admin-form-section">
          <div className="jobs-admin-form-section-heading">
            <span>02</span>

            <div>
              <h2>Employment Details</h2>

              <p>
                Define the working arrangement and experience
                level.
              </p>
            </div>
          </div>

          <div className="jobs-admin-form-grid">
            <div className="jobs-admin-field">
              <label htmlFor="experience_level">
                Experience Level
              </label>

              <select
                id="experience_level"
                name="experience_level"
                defaultValue={
                  currentJob.experience_level || ""
                }
              >
                <option value="">
                  Select experience level
                </option>

                {EXPERIENCE_OPTIONS.map((level) => (
                  <option
                    key={level}
                    value={level}
                  >
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="employment_type">
                Employment Type
              </label>

              <select
                id="employment_type"
                name="employment_type"
                defaultValue={
                  currentJob.employment_type || ""
                }
              >
                <option value="">
                  Select employment type
                </option>

                {EMPLOYMENT_OPTIONS.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="work_type">
                Work Type
              </label>

              <select
                id="work_type"
                name="work_type"
                defaultValue={
                  currentJob.work_type || ""
                }
              >
                <option value="">
                  Select work type
                </option>

                {WORK_TYPE_OPTIONS.map((type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* CONTENT */}

        <section className="jobs-admin-form-section">
          <div className="jobs-admin-form-section-heading">
            <span>03</span>

            <div>
              <h2>Job Content</h2>

              <p>
                Information candidates need to understand the
                role.
              </p>
            </div>
          </div>

          <div className="jobs-admin-form-grid">
            <div className="jobs-admin-field jobs-admin-field-full">
              <label htmlFor="summary">
                Short Summary
              </label>

              <textarea
                id="summary"
                name="summary"
                defaultValue={
                  currentJob.summary || ""
                }
                rows={4}
              />
            </div>

            <div className="jobs-admin-field jobs-admin-field-full">
              <label htmlFor="description">
                Job Description
              </label>

              <textarea
                id="description"
                name="description"
                defaultValue={
                  currentJob.description || ""
                }
                rows={8}
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="responsibilities">
                Responsibilities
              </label>

              <textarea
                id="responsibilities"
                name="responsibilities"
                defaultValue={
                  currentJob.responsibilities || ""
                }
                rows={9}
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="requirements">
                Requirements
              </label>

              <textarea
                id="requirements"
                name="requirements"
                defaultValue={
                  currentJob.requirements || ""
                }
                rows={9}
              />
            </div>
          </div>
        </section>

        {/* COMPENSATION */}

        <section className="jobs-admin-form-section">
          <div className="jobs-admin-form-section-heading">
            <span>04</span>

            <div>
              <h2>Compensation</h2>

              <p>
                Salary information for the opportunity.
              </p>
            </div>
          </div>

          <div className="jobs-admin-form-grid">
            <div className="jobs-admin-field">
              <label htmlFor="salary_min">
                Minimum Salary
              </label>

              <input
                id="salary_min"
                name="salary_min"
                type="number"
                min="0"
                defaultValue={
                  currentJob.salary_min ?? ""
                }
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="salary_max">
                Maximum Salary
              </label>

              <input
                id="salary_max"
                name="salary_max"
                type="number"
                min="0"
                defaultValue={
                  currentJob.salary_max ?? ""
                }
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="salary_currency">
                Currency
              </label>

              <select
                id="salary_currency"
                name="salary_currency"
                defaultValue={
                  currentJob.salary_currency || "NGN"
                }
              >
                <option value="NGN">
                  NGN — Nigerian Naira
                </option>

                <option value="GBP">
                  GBP — British Pound
                </option>

                <option value="USD">
                  USD — US Dollar
                </option>

                <option value="EUR">
                  EUR — Euro
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* APPLICATION */}

        <section className="jobs-admin-form-section">
          <div className="jobs-admin-form-section-heading">
            <span>05</span>

            <div>
              <h2>Application</h2>

              <p>
                Where candidates can apply and when applications
                close.
              </p>
            </div>
          </div>

          <div className="jobs-admin-form-grid">
            <div className="jobs-admin-field jobs-admin-field-full">
              <label htmlFor="application_url">
                Application URL <span>*</span>
              </label>

              <input
                id="application_url"
                name="application_url"
                type="url"
                defaultValue={
                  currentJob.application_url
                }
                required
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="application_deadline">
                Application Deadline
              </label>

              <input
                id="application_deadline"
                name="application_deadline"
                type="date"
                defaultValue={formatDateForInput(
                  currentJob.application_deadline
                )}
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="source_name">
                Source Name
              </label>

              <input
                id="source_name"
                name="source_name"
                type="text"
                defaultValue={
                  currentJob.source_name || ""
                }
              />
            </div>

            <div className="jobs-admin-field jobs-admin-field-full">
              <label htmlFor="source_url">
                Source URL
              </label>

              <input
                id="source_url"
                name="source_url"
                type="url"
                defaultValue={
                  currentJob.source_url || ""
                }
              />
            </div>
          </div>
        </section>

        {/* PUBLISHING */}

        <section className="jobs-admin-form-section">
          <div className="jobs-admin-form-section-heading">
            <span>06</span>

            <div>
              <h2>Publishing</h2>

              <p>
                Control the editorial status and public visibility
                of this opportunity.
              </p>
            </div>
          </div>

          <div className="jobs-admin-form-grid">
            <div className="jobs-admin-field">
              <label htmlFor="status">
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={currentJob.status}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="jobs-admin-featured-toggle">
              <label>
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={
                    currentJob.featured
                  }
                />

                <span>
                  <strong>Featured Job</strong>

                  <small>
                    Highlight this opportunity on the public
                    Jobs page.
                  </small>
                </span>
              </label>
            </div>
          </div>
        </section>

        {/* ACTIONS */}

        <div className="jobs-admin-form-actions">
          <Link
            href="/admin/jobs"
            className="jobs-admin-cancel-button"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="jobs-admin-submit-button"
          >
            Save Changes
          </button>
        </div>

        <JobAIReview 
           jobId={job.id}
           initialStatus={job.ai_review_status}
           initialNotes={job.ai_review_notes}
           initialConfidence={job.ai_confidence}
           initialModel={job.ai_model}
           initialReviewedAt={job.ai_reviewed_at}

        />  
        <PublishJob
        jobId={job.id}
        status={job.status}
      />
      
      </form>

      {/* DELETE */}

      <section className="jobs-admin-danger-zone">
        <div>
          <span>DANGER ZONE</span>

          <h2>Delete this job</h2>

          <p>
            Permanently remove this job from the Jobs database.
            This action cannot be undone.
          </p>
        </div>

        <form action={deleteJob}>
          <input
            type="hidden"
            name="id"
            value={currentJob.id}
          />

          <button
            type="submit"
            className="jobs-admin-delete-button"
          >
            Delete Job
          </button>
        </form>
      </section>
    </div>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function JobManageLoading() {
  return (
    <div className="jobs-admin-page">
      <div className="jobs-admin-loading">
        <span>CAREER DESK</span>

        <h1>Loading Job...</h1>

        <p>
          Preparing the job management workspace.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function ManageJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<JobManageLoading />}>
      <JobManageContentWrapper params={params} />
    </Suspense>
  );
}

async function JobManageContentWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <JobManageContent id={id} />;
}