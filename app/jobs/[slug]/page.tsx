import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import SocialIcons from "@/components/SocialIcons";
import { createAdminClient } from "@/lib/supabase/admin";
import "../jobs.css";
import "./job-details.css";

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
  summary: string | null;
  description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  application_deadline: string | null;
  application_url?: string | null;
  apply_url?: string | null;
  featured: boolean;
  created_at?: string | null;
};

function formatDeadline(deadline: string | null) {
  if (!deadline) return "Deadline not stated";

  return new Date(deadline).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatSalary(
  min: number | null,
  max: number | null,
  currency: string | null
) {
  if (!min && !max) return "Salary not stated";

  const symbol =
    currency === "NGN"
      ? "₦"
      : currency === "GBP"
        ? "£"
        : currency === "USD"
          ? "$"
          : currency
            ? `${currency} `
            : "";

  if (min && max) {
    return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  }

  if (min) {
    return `From ${symbol}${min.toLocaleString()}`;
  }

  if (max) {
    return `Up to ${symbol}${max.toLocaleString()}`;
  }

  return "Salary not stated";
}

function renderTextBlock(text: string | null | undefined) {
  if (!text) return null;

  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`${paragraph}-${index}`}>
        {paragraph}
      </p>
    ));
}

async function JobDetailsContent({
  slug,
}: {
  slug: string;
}) {
  const supabase = createAdminClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(
      "Job details fetch error:",
      JSON.stringify(error, null, 2)
    );
  }

  if (!job) {
    notFound();
  }

  const currentJob = job as Job;

  const applyUrl =
    currentJob.application_url ||
    currentJob.apply_url ||
    null;

  const description =
    currentJob.description ||
    currentJob.summary ||
    null;

  return (
    <main className="jobs-page job-details-page">

      {/* SITE HEADER */}
      <header className="top-header">
        <div className="header-main">

          <Link
            href="/"
            className="logo"
            aria-label="NaijaLaughs home"
          >
            <span className="logo-character">
              <img
                src="https://wyoycuacvenjisgsznoa.supabase.co/storage/v1/object/public/Naija%20Laugh/naijalaughheader.png"
                alt=""
                aria-hidden="true"
              />
            </span>

            <span className="logo-text">
              <strong>
                Naija<span>Laughs</span>
              </strong>

              <small>
                Same News. More Wahala. 😂
              </small>
            </span>
          </Link>

          <div className="search">
            <span>⌕</span>
            <span>Search news, people, topics...</span>
          </div>

          <SocialIcons />

        </div>

        <nav
          className="navigation"
          aria-label="Main navigation"
        >
          <Link href="/">
            Home
          </Link>

          <Link href="/category/nigeria">
            Nigeria
          </Link>

          <Link href="/category/africa">
            Africa
          </Link>

          <Link href="/category/world">
            World
          </Link>

          <Link href="/category/business">
            Business
          </Link>

          <Link href="/category/sports">
            Sports
          </Link>

          <Link href="/category/entertainment">
            Entertainment
          </Link>

          <Link href="/category/tech">
            Tech
          </Link>

          <Link href="/category/funny">
            Funny
          </Link>

          <Link
            href="/jobs"
            className="nav-active"
          >
            Jobs
          </Link>

          <Link href="/category/explainers">
            Explainers
          </Link>

          <Link
            href="/trending"
            className="nav-trending"
          >
            🔥 Trending
          </Link>
        </nav>
      </header>

      {/* JOB DETAILS */}
      <section className="job-details-content">

        <div className="jobs-container">

          <Link
            href="/jobs"
            className="job-back-link"
          >
            ← Back to Jobs
          </Link>

          <div className="job-details-layout">

            <article className="job-details-main">

              <div className="job-details-kicker">
                {currentJob.category || "CAREER OPPORTUNITY"}
              </div>

              <div className="job-details-heading">

                <div className="job-details-logo">
                  {currentJob.company_logo_url ? (
                    <img
                      src={currentJob.company_logo_url}
                      alt={`${currentJob.company_name} logo`}
                    />
                  ) : (
                    <span>
                      {currentJob.company_name
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <h1>
                    {currentJob.title}
                  </h1>

                  <p className="job-details-company">
                    {currentJob.company_name}
                  </p>
                </div>

              </div>

              <div className="job-details-meta">

                {currentJob.location && (
                  <span>
                    📍 {currentJob.location}
                  </span>
                )}

                {currentJob.work_type && (
                  <span>
                    💻 {currentJob.work_type}
                  </span>
                )}

                {currentJob.employment_type && (
                  <span>
                    🕐 {currentJob.employment_type}
                  </span>
                )}

                {currentJob.experience_level && (
                  <span>
                    🎓 {currentJob.experience_level}
                  </span>
                )}

              </div>

              {currentJob.summary && (
                <div className="job-details-summary">
                  {currentJob.summary}
                </div>
              )}

              {description && (
                <section className="job-details-section">

                  <h2>
                    About the Role
                  </h2>

                  <div className="job-details-copy">
                    {renderTextBlock(description)}
                  </div>

                </section>
              )}

              {currentJob.responsibilities && (
                <section className="job-details-section">

                  <h2>
                    Responsibilities
                  </h2>

                  <div className="job-details-copy">
                    {renderTextBlock(
                      currentJob.responsibilities
                    )}
                  </div>

                </section>
              )}

              {currentJob.requirements && (
                <section className="job-details-section">

                  <h2>
                    Requirements
                  </h2>

                  <div className="job-details-copy">
                    {renderTextBlock(
                      currentJob.requirements
                    )}
                  </div>

                </section>
              )}

            </article>

            {/* JOB SIDEBAR */}
            <aside className="job-details-sidebar">

              <div className="job-apply-card">

                {currentJob.featured && (
                  <span className="job-details-featured">
                    FEATURED OPPORTUNITY
                  </span>
                )}

                <h2>
                  {formatSalary(
                    currentJob.salary_min,
                    currentJob.salary_max,
                    currentJob.salary_currency
                  )}
                </h2>

                <div className="job-sidebar-item">
                  <span>
                    APPLICATION DEADLINE
                  </span>

                  <strong>
                    {formatDeadline(
                      currentJob.application_deadline
                    )}
                  </strong>
                </div>

                {applyUrl ? (
                  <a
                    href={applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="job-details-apply"
                  >
                    Apply Now →
                  </a>
                ) : (
                  <span className="job-details-apply job-details-no-link">
                    Application Link Unavailable
                  </span>
                )}

              </div>

              <div className="job-sidebar-card">

                <span>
                  COMPANY
                </span>

                <h3>
                  {currentJob.company_name}
                </h3>

                {currentJob.location && (
                  <p>
                    📍 {currentJob.location}
                  </p>
                )}

              </div>

            </aside>

          </div>

        </div>

      </section>

      {/* FOOTER CTA */}
      <section className="jobs-footer-cta">
        <div className="jobs-container">

          <div>
            <span>
              NAIJALAUGHS JOBS
            </span>

            <h2>
              Find your next
              <br />
              opportunity.
            </h2>
          </div>

          <Link
            href="/jobs"
            className="jobs-home-link"
          >
            Browse More Jobs
          </Link>

        </div>
      </section>

    </main>
  );
}

function JobDetailsLoading() {
  return (
    <main className="jobs-page job-details-page">

      <section className="jobs-loading">
        <div>
          <span>
            NAIJALAUGHS
          </span>

          <h1>
            Loading opportunity...
          </h1>
        </div>
      </section>

    </main>
  );
}

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;

  return (
    <Suspense fallback={<JobDetailsLoading />}>
      <JobDetailsContent slug={resolvedParams.slug} />
    </Suspense>
  );
}