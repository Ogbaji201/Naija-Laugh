"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "../jobs.css";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "review", label: "Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
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

function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function NewJobPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    company_name: "",
    company_logo_url: "",
    category: "",
    experience_level: "",
    employment_type: "",
    work_type: "",
    location: "",
    country: "Nigeria",
    summary: "",
    description: "",
    requirements: "",
    responsibilities: "",
    salary_min: "",
    salary_max: "",
    salary_currency: "NGN",
    application_deadline: "",
    application_url: "",
    source_url: "",
    source_name: "",
    status: "pending",
    featured: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (!form.title.trim()) {
      setErrorMessage("Please enter a job title.");
      return;
    }

    if (!form.company_name.trim()) {
      setErrorMessage("Please enter the company name.");
      return;
    }

    if (!form.application_url.trim()) {
      setErrorMessage("Please enter an application URL.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          slug: createSlug(form.title),
          salary_min: form.salary_min
            ? Number(form.salary_min)
            : null,
          salary_max: form.salary_max
            ? Number(form.salary_max)
            : null,
          application_deadline: form.application_deadline
            ? new Date(
                `${form.application_deadline}T23:59:59`
              ).toISOString()
            : null,
          company_logo_url:
            form.company_logo_url.trim() || null,
          category: form.category || null,
          experience_level:
            form.experience_level || null,
          employment_type:
            form.employment_type || null,
          work_type: form.work_type || null,
          location: form.location.trim() || null,
          country: form.country.trim() || "Nigeria",
          summary: form.summary.trim() || null,
          description: form.description.trim() || null,
          requirements:
            form.requirements.trim() || null,
          responsibilities:
            form.responsibilities.trim() || null,
          salary_currency:
            form.salary_currency.trim() || null,
          source_url: form.source_url.trim() || null,
          source_name: form.source_name.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create the job."
        );
      }

      router.push("/admin/jobs");
      router.refresh();
    } catch (error) {
      console.error("Create job error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the job."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="jobs-admin-page">
      <div className="jobs-admin-header">
        <div>
          <span className="admin-section-kicker">
            CAREER DESK
          </span>

          <h1>Add Job</h1>

          <p>
            Create a new career opportunity for the NaijaLaughs
            Jobs section.
          </p>
        </div>

        <Link
          href="/admin/jobs"
          className="jobs-admin-secondary-button"
        >
          ← Back to Jobs
        </Link>
      </div>

      <form
        className="jobs-admin-form"
        onSubmit={handleSubmit}
      >
        {errorMessage && (
          <div className="jobs-admin-form-error">
            {errorMessage}
          </div>
        )}

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
                type="text"
                value={form.title}
                onChange={(event) =>
                  updateField("title", event.target.value)
                }
                placeholder="e.g. Data Analyst"
                required
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="company_name">
                Company Name <span>*</span>
              </label>

              <input
                id="company_name"
                type="text"
                value={form.company_name}
                onChange={(event) =>
                  updateField(
                    "company_name",
                    event.target.value
                  )
                }
                placeholder="e.g. Access Bank"
                required
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="company_logo_url">
                Company Logo URL
              </label>

              <input
                id="company_logo_url"
                type="url"
                value={form.company_logo_url}
                onChange={(event) =>
                  updateField(
                    "company_logo_url",
                    event.target.value
                  )
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
                value={form.category}
                onChange={(event) =>
                  updateField(
                    "category",
                    event.target.value
                  )
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
                type="text"
                value={form.location}
                onChange={(event) =>
                  updateField(
                    "location",
                    event.target.value
                  )
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
                type="text"
                value={form.country}
                onChange={(event) =>
                  updateField(
                    "country",
                    event.target.value
                  )
                }
                placeholder="Nigeria"
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
                value={form.experience_level}
                onChange={(event) =>
                  updateField(
                    "experience_level",
                    event.target.value
                  )
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
                value={form.employment_type}
                onChange={(event) =>
                  updateField(
                    "employment_type",
                    event.target.value
                  )
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
                value={form.work_type}
                onChange={(event) =>
                  updateField(
                    "work_type",
                    event.target.value
                  )
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

        {/* JOB CONTENT */}

        <section className="jobs-admin-form-section">
          <div className="jobs-admin-form-section-heading">
            <span>03</span>

            <div>
              <h2>Job Content</h2>

              <p>
                Provide the information candidates need to
                understand the role.
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
                value={form.summary}
                onChange={(event) =>
                  updateField(
                    "summary",
                    event.target.value
                  )
                }
                placeholder="A short overview of the opportunity..."
                rows={4}
              />
            </div>

            <div className="jobs-admin-field jobs-admin-field-full">
              <label htmlFor="description">
                Job Description
              </label>

              <textarea
                id="description"
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                placeholder="Describe the role, team and overall opportunity..."
                rows={7}
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="responsibilities">
                Responsibilities
              </label>

              <textarea
                id="responsibilities"
                value={form.responsibilities}
                onChange={(event) =>
                  updateField(
                    "responsibilities",
                    event.target.value
                  )
                }
                placeholder="List the main responsibilities..."
                rows={8}
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="requirements">
                Requirements
              </label>

              <textarea
                id="requirements"
                value={form.requirements}
                onChange={(event) =>
                  updateField(
                    "requirements",
                    event.target.value
                  )
                }
                placeholder="List the key requirements..."
                rows={8}
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
                Add salary information where it is available.
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
                type="number"
                min="0"
                value={form.salary_min}
                onChange={(event) =>
                  updateField(
                    "salary_min",
                    event.target.value
                  )
                }
                placeholder="e.g. 300000"
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="salary_max">
                Maximum Salary
              </label>

              <input
                id="salary_max"
                type="number"
                min="0"
                value={form.salary_max}
                onChange={(event) =>
                  updateField(
                    "salary_max",
                    event.target.value
                  )
                }
                placeholder="e.g. 500000"
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="salary_currency">
                Currency
              </label>

              <select
                id="salary_currency"
                value={form.salary_currency}
                onChange={(event) =>
                  updateField(
                    "salary_currency",
                    event.target.value
                  )
                }
              >
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
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
                Tell candidates where and when to apply.
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
                type="url"
                value={form.application_url}
                onChange={(event) =>
                  updateField(
                    "application_url",
                    event.target.value
                  )
                }
                placeholder="https://company.com/careers/job..."
                required
              />

              <small>
                This is where candidates will be sent to apply.
              </small>
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="application_deadline">
                Application Deadline
              </label>

              <input
                id="application_deadline"
                type="date"
                value={form.application_deadline}
                onChange={(event) =>
                  updateField(
                    "application_deadline",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="jobs-admin-field">
              <label htmlFor="source_name">
                Source Name
              </label>

              <input
                id="source_name"
                type="text"
                value={form.source_name}
                onChange={(event) =>
                  updateField(
                    "source_name",
                    event.target.value
                  )
                }
                placeholder="e.g. Company Careers Page"
              />
            </div>

            <div className="jobs-admin-field jobs-admin-field-full">
              <label htmlFor="source_url">
                Source URL
              </label>

              <input
                id="source_url"
                type="url"
                value={form.source_url}
                onChange={(event) =>
                  updateField(
                    "source_url",
                    event.target.value
                  )
                }
                placeholder="https://..."
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
                Decide how this opportunity should enter the
                editorial workflow.
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
                value={form.status}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value
                  )
                }
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
                  checked={form.featured}
                  onChange={(event) =>
                    updateField(
                      "featured",
                      event.target.checked
                    )
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
            disabled={submitting}
          >
            {submitting ? "Creating Job..." : "Create Job"}
          </button>
        </div>
      </form>
    </div>
  );
}