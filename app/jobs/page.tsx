import { Suspense } from "react";
import Link from "next/link";
import SocialIcons from "@/components/SocialIcons";
import { createAdminClient } from "@/lib/supabase/admin";
import "./jobs.css";

type Job = {
  id: string;
  title?: string | null;
  role?: string | null;
  company?: string | null;
  employer?: string | null;
  location?: string | null;
  employment_type?: string | null;
  job_type?: string | null;
  description?: string | null;
  summary?: string | null;
  application_url?: string | null;
  apply_url?: string | null;
  featured?: boolean | null;
  created_at?: string | null;
};

function getJobTitle(job: Job) {
  return job.title || job.role || "Untitled Opportunity";
}

function getCompany(job: Job) {
  return job.company || job.employer || "Company";
}

function getLocation(job: Job) {
  return job.location || "Nigeria";
}

function getJobType(job: Job) {
  return job.employment_type || job.job_type || "Opportunity";
}

function getDescription(job: Job) {
  return (
    job.summary ||
    job.description ||
    "View this opportunity for more information."
  );
}

function formatDate(date?: string | null) {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

async function JobsContent() {
  const supabase = createAdminClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs page error:", error);
  }

  const publishedJobs = (jobs || []) as Job[];

  const featuredJobs = publishedJobs.filter((job) => job.featured);
  const regularJobs = publishedJobs.filter((job) => !job.featured);

  return (
    <main className="jobs-page">

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

      {/* JOBS HERO */}
      <section className="jobs-hero">
        <div className="jobs-container">
          <div className="jobs-hero-content">

            <span className="jobs-kicker">
              NAIJALAUGHS CAREER DESK
            </span>

            <h1>
              Find Your Next
              <br />
              <strong>Opportunity.</strong>
            </h1>

            <p>
              Discover jobs, career opportunities and openings worth
              knowing about — curated for Nigerians and Africans.
            </p>

          </div>
        </div>
      </section>

      {/* JOBS CONTENT */}
      <section className="jobs-content">
        <div className="jobs-container">

          <div className="jobs-section-heading">
            <div>
              <span>
                CAREER OPPORTUNITIES
              </span>

              <h2>
                Latest Jobs
              </h2>
            </div>

            <p>
              {publishedJobs.length}{" "}
              {publishedJobs.length === 1
                ? "opportunity"
                : "opportunities"}{" "}
              available
            </p>
          </div>

          {publishedJobs.length === 0 ? (
            <div className="jobs-empty">

              <span>
                NO OPENINGS YET
              </span>

              <h2>
                New opportunities are coming.
              </h2>

              <p>
                Check back soon for the latest jobs and career
                opportunities published by NaijaLaughs.
              </p>

            </div>
          ) : (
            <>
              {featuredJobs.length > 0 && (
                <section className="jobs-featured">

                  <div className="jobs-subheading">
                    <span>
                      FEATURED
                    </span>

                    <h3>
                      Opportunities worth a closer look
                    </h3>
                  </div>

                  <div className="jobs-featured-grid">

                    {featuredJobs.map((job) => (
                      <article
                        className="job-featured-card"
                        key={job.id}
                      >

                        <div className="job-card-top">

                          <span className="job-featured-label">
                            FEATURED
                          </span>

                          {job.created_at && (
                            <span className="job-date">
                              {formatDate(job.created_at)}
                            </span>
                          )}

                        </div>

                        <h3>
                          {getJobTitle(job)}
                        </h3>

                        <p className="job-company">
                          {getCompany(job)}
                        </p>

                        <div className="job-meta">
                          <span>
                            {getLocation(job)}
                          </span>

                          <span>
                            {getJobType(job)}
                          </span>
                        </div>

                        <p className="job-description">
                          {getDescription(job)}
                        </p>

                        {job.application_url ||
                        job.apply_url ? (
                          <a
                            href={
                              job.application_url ||
                              job.apply_url ||
                              "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="job-apply-button"
                          >
                            View Opportunity
                          </a>
                        ) : (
                          <span className="job-apply-button job-no-link">
                            Opportunity Details
                          </span>
                        )}

                      </article>
                    ))}

                  </div>
                </section>
              )}

              {regularJobs.length > 0 && (
                <section className="jobs-list-section">

                  <div className="jobs-subheading">
                    <span>
                      MORE OPPORTUNITIES
                    </span>

                    <h3>
                      Latest openings
                    </h3>
                  </div>

                  <div className="jobs-list">

                    {regularJobs.map((job) => (
                      <article
                        className="job-list-card"
                        key={job.id}
                      >

                        <div className="job-list-main">

                          <div className="job-list-company">
                            {getCompany(job)}
                          </div>

                          <h3>
                            {getJobTitle(job)}
                          </h3>

                          <div className="job-meta">
                            <span>
                              {getLocation(job)}
                            </span>

                            <span>
                              {getJobType(job)}
                            </span>
                          </div>

                          <p>
                            {getDescription(job)}
                          </p>

                        </div>

                        <div className="job-list-side">

                          {job.created_at && (
                            <span className="job-date">
                              {formatDate(job.created_at)}
                            </span>
                          )}

                          {job.application_url ||
                          job.apply_url ? (
                            <a
                              href={
                                job.application_url ||
                                job.apply_url ||
                                "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="job-list-button"
                            >
                              Apply
                            </a>
                          ) : (
                            <span className="job-list-button job-no-link">
                              Details
                            </span>
                          )}

                        </div>

                      </article>
                    ))}

                  </div>
                </section>
              )}
            </>
          )}

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
              Your next opportunity
              <br />
              could be here.
            </h2>
          </div>

          <Link
            href="/"
            className="jobs-home-link"
          >
            Back to NaijaLaughs
          </Link>

        </div>
      </section>

    </main>
  );
}

function JobsLoading() {
  return (
    <main className="jobs-page">
      <section className="jobs-loading">
        <div>
          <span>
            NAIJALAUGHS
          </span>

          <h1>
            Loading opportunities...
          </h1>
        </div>
      </section>
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsLoading />}>
      <JobsContent />
    </Suspense>
  );
}