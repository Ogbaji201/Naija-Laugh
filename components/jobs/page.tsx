import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  application_deadline: string | null;
  featured: boolean;
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

export default async function JobsPage() {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      slug,
      company_name,
      company_logo_url,
      category,
      experience_level,
      employment_type,
      work_type,
      location,
      country,
      summary,
      salary_min,
      salary_max,
      salary_currency,
      application_deadline,
      featured
    `
    )
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Jobs fetch error:", error);
  }

  const publishedJobs = (jobs ?? []) as Job[];

  return (
    <main className="naija-site">
      {/* HEADER */}
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
            <span>Search jobs...</span>
          </div>
        </div>

        <nav className="navigation" aria-label="Main navigation">
          <Link href="/">Home</Link>
          <Link href="/category/nigeria">Nigeria</Link>
          <Link href="/category/africa">Africa</Link>
          <Link href="/category/world">World</Link>
          <Link href="/category/business">Business</Link>
          <Link href="/category/sports">Sports</Link>
          <Link href="/category/entertainment">Entertainment</Link>
          <Link href="/category/tech">Tech</Link>
          <Link href="/category/funny">Funny</Link>

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
        <div className="content">
          <div className="jobs-hero-content">
            <span className="jobs-label">
              💼 NAIJA JOBS
            </span>

            <h1>
              Find Your Next
              <span> Opportunity.</span>
            </h1>

            <p>
              Job opportunities, internships, graduate programmes
              and remote roles — all in one place.
            </p>
          </div>
        </div>
      </section>

      {/* JOBS CONTENT */}
      <section className="content jobs-section">

        {/* FILTER BAR */}
        <div className="jobs-filters">
          <div className="jobs-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search jobs, companies or skills..."
              aria-label="Search jobs"
            />
          </div>

          <select defaultValue="">
            <option value="">All Categories</option>
            <option value="Technology">Technology</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
            <option value="Data">Data</option>
            <option value="Engineering">Engineering</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Administration">
              Administration
            </option>
          </select>

          <select defaultValue="">
            <option value="">All Locations</option>
            <option value="Lagos">Lagos</option>
            <option value="Abuja">Abuja</option>
            <option value="Port Harcourt">
              Port Harcourt
            </option>
            <option value="Remote">Remote</option>
          </select>

          <select defaultValue="">
            <option value="">Work Type</option>
            <option value="Remote">Remote</option>
            <option value="Hybrid">Hybrid</option>
            <option value="On-site">On-site</option>
          </select>
        </div>

        {/* SECTION HEADER */}
        <div className="section-header jobs-section-header">
          <div>
            <h2>Latest Jobs</h2>
            <p>
              Fresh opportunities reviewed by NaijaLaughs.
            </p>
          </div>

          <span className="jobs-count">
            {publishedJobs.length}{" "}
            {publishedJobs.length === 1
              ? "job"
              : "jobs"}
          </span>
        </div>

        {/* JOB LIST */}
        {publishedJobs.length > 0 ? (
          <div className="jobs-grid">
            {publishedJobs.map((job) => (
              <article
                key={job.id}
                className={`job-card ${
                  job.featured
                    ? "job-card-featured"
                    : ""
                }`}
              >
                {job.featured && (
                  <div className="job-featured-badge">
                    ⭐ Featured
                  </div>
                )}

                <div className="job-card-top">
                  <div className="company-logo">
                    {job.company_logo_url ? (
                      <img
                        src={job.company_logo_url}
                        alt={`${job.company_name} logo`}
                      />
                    ) : (
                      <span>
                        {job.company_name
                          .charAt(0)
                          .toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="job-category">
                      {job.category || "JOB"}
                    </span>

                    <h3>{job.title}</h3>

                    <p className="job-company">
                      {job.company_name}
                    </p>
                  </div>
                </div>

                <div className="job-meta">
                  {job.location && (
                    <span>
                      📍 {job.location}
                    </span>
                  )}

                  {job.work_type && (
                    <span>
                      💻 {job.work_type}
                    </span>
                  )}

                  {job.employment_type && (
                    <span>
                      🕐 {job.employment_type}
                    </span>
                  )}

                  {job.experience_level && (
                    <span>
                      🎓 {job.experience_level}
                    </span>
                  )}
                </div>

                {job.summary && (
                  <p className="job-summary">
                    {job.summary}
                  </p>
                )}

                <div className="job-card-bottom">
                  <div>
                    <strong>
                      {formatSalary(
                        job.salary_min,
                        job.salary_max,
                        job.salary_currency
                      )}
                    </strong>

                    <small>
                      Deadline:{" "}
                      {formatDeadline(
                        job.application_deadline
                      )}
                    </small>
                  </div>

                  <Link
                    href={`/jobs/${job.slug}`}
                    className="job-view-button"
                  >
                    View Job →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="jobs-empty">
            <div className="jobs-empty-icon">
              💼
            </div>

            <h3>
              No jobs available yet
            </h3>

            <p>
              We're reviewing new opportunities.
              Check back soon for fresh jobs.
            </p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="content footer-grid">
          <div>
            <h2>
              Naija<span>Laughs</span>
            </h2>

            <p>
              Same News. More Wahala. 😂
              <br />
              Nigeria, Africa and the world —
              with a Nigerian sense of humour.
            </p>
          </div>

          <div>
            <h3>Explore</h3>

            <p>
              Nigeria
              <br />
              Africa
              <br />
              World
              <br />
              Business
              <br />
              Sports
            </p>
          </div>

          <div>
            <h3>More</h3>

            <p>
              Entertainment
              <br />
              Funny
              <br />
              Jobs
              <br />
              Explainers
              <br />
              Cartoons
            </p>
          </div>

          <div>
            <h3>Stay Updated</h3>

            <p>
              Get the biggest stories and funniest
              moments in your inbox.
            </p>

            <button type="button">
              Subscribe →
            </button>
          </div>
        </div>

        <div className="content copyright">
          © 2026 NaijaLaughs. All rights reserved.
        </div>
      </footer>
    </main>
  );
}