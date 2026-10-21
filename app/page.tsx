import Link from "next/link";
import { Suspense } from "react";
import SocialIcons from "@/components/SocialIcons";
import { createClient } from "@/lib/supabase/server";
import HomepageCartoon from "../components/HomepageCartoon";

const latestNews = [
    {
      category: "BUSINE SS",
      title: "Naira Shows Signs of Stability — For How Long?",
      time: "1 hour ago",
      art: "₦",
    },
    {
      category: "WORLD",
      title: "Global Leaders Make New Economic Moves",
      time: "2 hours ago",
      art: "🌍",
    },
    {
      category: "ENTERTAINMENT",
      title: "Nigerians React to Another Celebrity Trend",
      time: "3 hours ago",
      art: "★",
    },
    {
      category: "TECH",
      title: "New Technology Everyone Is Talking About",
      time: "4 hours ago",
      art: "◉",
    },
  ];

const sideStories = [
    ["ENTERTAINMENT", "Davido Trends Again — This Time For Something Hilarious", "★", "3 hours ago"],
    ["AFRICA", "Ghana's New Leader Makes Bold Promises — Nigerians React", "◆", "4 hours ago"],
    ["SPORTS", "Super Eagles Qualify After Thrilling Win", "⚽", "5 hours ago"],
    ["TECH", "WhatsApp Rolls New Feature — Here's What It Means", "◉", "6 hours ago"],
  ];

const trending = [
    ["Fuel price again? Nigerians react", "120K"],
    ["Davido's new move sparks reactions", "95K"],
    ["NYSC post goes viral for all the wrong reasons", "88K"],
    ["Ghana's new leader and Nigeria's angle", "76K"],
    ["What that CBN announcement really means", "64K"],
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
    summary: string | null;
    salary_min: number | null;
    salary_max: number | null;
    salary_currency: string | null;
    application_deadline: string | null;
    featured: boolean;
  };

type Article = {
  id: string;
  headline: string;
  standfirst: string | null;
  body: string | null;
  slug: string;
  published_at: string | null;
};

function formatArticleTime(publishedAt: string | null) {
  if (!publishedAt) return "Recently";

  return new Date(publishedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function articleArt(index: number) {
  const art = ["🇳🇬", "🌍", "₦", "★", "◉"];
  return art[index % art.length];
}

async function HomepageNews() {
  const supabase = await createClient();

  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select(
      `
      id,
      headline,
      standfirst,
      body,
      slug,
      published_at
      `
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(5);

  if (articlesError) {
    console.error(
      "Homepage articles fetch error:",
      JSON.stringify(articlesError, null, 2)
    );
  }

  const publishedArticles = (articles ?? []) as Article[];

  if (publishedArticles.length === 0) {
    return (
      <>
        {/* FEATURED STORY - FALLBACK */}
        <div className="featured-layout">
          <article className="featured">
            <div className="featured-image">
              <div className="economy-illustration">
                <div className="money-circle">₦</div>
                <span>THE ECONOMY</span>
              </div>
            </div>

            <div className="featured-overlay" />

            <div className="featured-content">
              <span className="category">NIGERIA</span>

              <h2>
                New Economic Policy: What It Means
                For Nigerians And How It Could
                Affect Your Pocket
              </h2>

              <p>
                The federal government has announced a new set of economic
                measures aimed at stabilising the naira. Here&apos;s a simple
                breakdown of what happened, what it means, and what to expect.
              </p>

              <small>
                By NaijaLaughs Team&nbsp;&nbsp; | &nbsp;&nbsp;
                2 hours ago&nbsp;&nbsp; | &nbsp;&nbsp;6 min read
              </small>
            </div>

            <span className="feature-arrow">→</span>
          </article>

          <div className="side-stories">
            {sideStories.map(([category, title, symbol, time]) => (
              <article className="side-story" key={title}>
                <div className="side-image">{symbol}</div>

                <div className="side-content">
                  <span>{category}</span>
                  <h3>{title}</h3>
                  <small>◷ {time}</small>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="section-header" id="latest-news">
          <h2>Latest News</h2>
          <a href="#">View all →</a>
        </div>

        <div className="latest-grid">
          {latestNews.map((item) => (
            <article className="latest-card" key={item.title}>
              <div className="latest-image">
                <span>{item.art}</span>
              </div>

              <div className="latest-copy">
                <span>{item.category}</span>
                <h3>{item.title}</h3>
                <small>◷ {item.time}</small>
              </div>
            </article>
          ))}
        </div>
      </>
    );
  }

  const [featuredArticle, ...latestArticles] = publishedArticles;

  return (
    <>
      {/* FEATURED STORY - LIVE */}
      <div className="featured-layout">
        <Link
          href={`/article/${featuredArticle.slug}`}
          className="featured"
          style={{ textDecoration: "none", color: "inherit" }}
          aria-label={`Read ${featuredArticle.headline}`}
        >
          <div className="featured-image">
            <div className="economy-illustration">
              <div className="money-circle">
                {articleArt(0)}
              </div>
              <span>LATEST NEWS</span>
            </div>
          </div>

          <div className="featured-overlay" />

          <div className="featured-content">
            <span className="category">NEWS</span>

            <h2>{featuredArticle.headline}</h2>

            {featuredArticle.standfirst && (
              <p>{featuredArticle.standfirst}</p>
            )}

            <small>
              By NaijaLaughs Team&nbsp;&nbsp; | &nbsp;&nbsp;
              {formatArticleTime(featuredArticle.published_at)}
            </small>
          </div>

          <span className="feature-arrow">→</span>
        </Link>

        <div className="side-stories">
          {latestArticles.slice(0, 4).map((article, index) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="side-story"
              style={{ textDecoration: "none", color: "inherit" }}
              aria-label={`Read ${article.headline}`}
            >
              <div className="side-image">
                {articleArt(index + 1)}
              </div>

              <div className="side-content">
                <span>NEWS</span>

                <h3>{article.headline}</h3>

                <small>
                  ◷ {formatArticleTime(article.published_at)}
                </small>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* LATEST NEWS - LIVE */}
      <div className="section-header" id="latest-news">
        <h2>Latest News</h2>
        <a href="#latest-news">View all →</a>
      </div>

      <div className="latest-grid">
        {publishedArticles.map((article, index) => (
          <Link
            key={article.id}
            href={`/article/${article.slug}`}
            className="latest-card"
            style={{ textDecoration: "none", color: "inherit" }}
            aria-label={`Read ${article.headline}`}
          >
            <div className="latest-image">
              <span>{articleArt(index)}</span>
            </div>

            <div className="latest-copy">
              <span>NEWS</span>

              <h3>{article.headline}</h3>

              <small>
                ◷ {formatArticleTime(article.published_at)}
              </small>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function HomepageNewsLoading() {
  return (
    <>
      <div className="featured-layout">
        <article className="featured">
          <div className="featured-image">
            <div className="economy-illustration">
              <div className="money-circle">📰</div>
              <span>LOADING NEWS</span>
            </div>
          </div>

          <div className="featured-overlay" />

          <div className="featured-content">
            <span className="category">NEWS</span>
            <h2>Loading the latest published story...</h2>
            <p>NaijaLaughs is fetching the latest editorial content.</p>
          </div>
        </article>

        <div className="side-stories">
          {[1, 2, 3, 4].map((item) => (
            <article className="side-story" key={item}>
              <div className="side-image">📰</div>
              <div className="side-content">
                <span>NEWS</span>
                <h3>Loading latest story...</h3>
                <small>◷ Please wait</small>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="section-header" id="latest-news">
        <h2>Latest News</h2>
      </div>
    </>
  );
}

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

async function HomepageJobs() {
  const supabase = await createClient();

  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  if (jobsError) {
    console.error(
      "Homepage jobs fetch error:",
      JSON.stringify(jobsError, null, 2)
    );
  }

  const publishedJobs = (jobs ?? []) as Job[];

  return (
    <section className="home-jobs">
      <div className="section-header">
        <div>
          <h2>💼 Latest Jobs</h2>
          <p className="home-jobs-subtitle">
            Fresh opportunities reviewed by NaijaLaughs.
          </p>
        </div>
        <Link href="/jobs">View all jobs →</Link>
      </div>

      {publishedJobs.length > 0 ? (
        <div className="jobs-grid">
          {publishedJobs.map((job) => (
            <article
              key={job.id}
              className={`job-card ${job.featured ? "job-card-featured" : ""}`}
            >
              {job.featured && (
                <div className="job-featured-badge">⭐ Featured</div>
              )}

              <div className="job-card-top">
                <div className="company-logo">
                  {job.company_logo_url ? (
                    <img
                      src={job.company_logo_url}
                      alt={`${job.company_name} logo`}
                    />
                  ) : (
                    <span>{job.company_name.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div>
                  <span className="job-category">{job.category || "JOB"}</span>
                  <h3>{job.title}</h3>
                  <p className="job-company">{job.company_name}</p>
                </div>
              </div>

              <div className="job-meta">
                {job.location && <span>📍 {job.location}</span>}
                {job.work_type && <span>💻 {job.work_type}</span>}
                {job.employment_type && <span>🕐 {job.employment_type}</span>}
                {job.experience_level && <span>🎓 {job.experience_level}</span>}
              </div>

              {job.summary && <p className="job-summary">{job.summary}</p>}

              <div className="job-card-bottom">
                <div>
                  <strong>
                    {formatSalary(
                      job.salary_min,
                      job.salary_max,
                      job.salary_currency
                    )}
                  </strong>
                  <small>Deadline: {formatDeadline(job.application_deadline)}</small>
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
        <div className="home-jobs-empty">
          <span>💼</span>
          <div>
            <h3>Jobs are coming to NaijaLaughs</h3>
            <p>
              We&apos;re reviewing opportunities and will publish fresh jobs here soon.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function HomepageJobsLoading() {
  return (
    <section className="home-jobs">
      <div className="section-header">
        <div>
          <h2>💼 Latest Jobs</h2>
          <p className="home-jobs-subtitle">Loading the latest opportunities...</p>
        </div>
      </div>

      <div className="home-jobs-empty">
        <span>💼</span>
        <div>
          <h3>Loading jobs...</h3>
          <p>NaijaLaughs is checking the latest opportunities.</p>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
    const heroImageUrl = "https://wyoycuacvenjisgsznoa.supabase.co/storage/v1/object/public/Naija%20Laugh/Naija%20Hero.png";
    return (
      <main className="naija-site">

        {/* HEADER */}
        <header className="top-header">
          <div className="header-main">
           <a
              href="#"
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
            </a>

            <div className="search">
              <span>⌕</span>
              <span>Search news, people, topics...</span>
            </div>

            <SocialIcons />

          </div>

          <nav className="navigation" aria-label="Main navigation">
            <Link href="/" className="nav-active">
              Home
            </Link>

            <Link href="/category/nigeria">Nigeria</Link>
            <Link href="/category/africa">Africa</Link>
            <Link href="/category/world">World</Link>
            <Link href="/category/business">Business</Link>
            <Link href="/category/sports">Sports</Link>
            <Link href="/category/entertainment">Entertainment</Link>
            <Link href="/category/tech">Tech</Link>
            <Link href="/category/funny">Funny</Link>

            <Link href="/jobs">
              Jobs
            </Link>

            <Link href="/category/explainers">
              Explainers
            </Link>

            <Link href="/trending" className="nav-trending">
              🔥 Trending
            </Link>
          </nav>
        </header>

        {/* BREAKING NEWS */}
        <div className="breaking">
          <div className="breaking-inner">
            <span className="breaking-label">
              ⚡ BREAKING
            </span>

            <span className="breaking-story">
              Fuel price may go up again — Nigerians react with memes and hot takes →
            </span>

            <span className="breaking-location">
              Lagos, Nigeria&nbsp;&nbsp;|&nbsp;&nbsp;22°C ☀️
            </span>
          </div>
        </div>

        {/* HERO */}
        <section className="hero-section">
          <div className="hero-image-wrapper">

            <img
              src={heroImageUrl}
              alt="Naija No Dull Moment — NaijaLaughs Lagos danfo illustration"
              className="hero-image"
              fetchPriority="high"
            />

            {/* REAL HTML BUTTON */}
            <a
              href="#latest-news"
              className="hero-explore-button"
            >
              Explore Latest News →
            </a>

          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="content">
          <div className="main-layout">

            <div className="main-column">

              {/* LIVE NEWS */}
              <Suspense fallback={<HomepageNewsLoading />}>
                <HomepageNews />
              </Suspense>

              {/* JOBS */}
              <Suspense fallback={<HomepageJobsLoading />}>
                <HomepageJobs />
              </Suspense>

            </div>

            {/* SIDEBAR */}
            <aside className="sidebar">

              <section className="trending-card">

                <div className="sidebar-title">

                  <h2>
                    🔥 Trending Now
                  </h2>

                  <Link href="/trending">
                    View all →
                  </Link>

                </div>

                {trending.map(
                  ([story, views], index) => (
                    <div
                      className="trend-item"
                      key={story}
                    >

                      <strong>
                        {index + 1}
                      </strong>

                      <div>

                        <h3>
                          {story}
                        </h3>

                        <small>
                          ↗ {views}
                        </small>

                      </div>

                    </div>
                  )
                )}

              </section>

              <section className="angle-card">

                <h2>
                  😂 The Naija Angle
                </h2>

                <p>
                  In simple terms: transport fares may go up,
                  prices of goods could increase, and Nigerians
                  are already sharing funny but real reactions online.
                </p>

                <button type="button">
                  Read the full story →
                </button>

                <div className="angle-character">
                  🤔
                </div>

              </section>

              <section className="take-card">

                <h2>
                  💡 Our Take
                </h2>

                <p>
                  Just when you thought we were adjusting...
                </p>

                <strong>
                  Nigeria: "Hold my fuel pump." 😂
                </strong>

              </section>

            </aside>

          </div>
        </section>

        {/* TODAY IN NIGERIA */}
        <section className="today">

          <div className="content">

            <div className="section-header">

              <h2>
                🙂 Today in Nigeria 😂
              </h2>

              <a href="#">
                See more →
              </a>

            </div>

            <div className="today-layout">

              <article className="today-feature">

                <div className="queue-art">

                  <div className="fuel-sign">
                    PETROL
                    <br />
                    STILL
                    <br />
                    LOADING...
                  </div>

                  <div className="people">
                    ● ● ● ● ● ● ●
                  </div>

                </div>

                <div>

                  <span>
                    EVERYDAY NAIJA
                  </span>

                  <h3>
                    The National Sport:
                    Queueing With
                    Determination 😂
                  </h3>

                  <p>
                    No matter the challenge, Nigerians
                    always find a way to stay strong,
                    make jokes and keep moving.
                  </p>

                  <a href="#">
                    Read the story →
                  </a>

                </div>

              </article>

              <article className="today-small">

                <div className="small-art politics">
                  🏛️
                </div>

                <span>
                  POLITICS
                </span>

                <h3>
                  Government Announces New Measures —
                  Nigerians Have Questions
                </h3>

              </article>

              <article className="today-small">

                <div className="small-art social">
                  🇳🇬
                </div>

                <span>
                  SOCIAL
                </span>

                <h3>
                  Nigerians Speak: We Just Want A Better Tomorrow
                </h3>

              </article>

            </div>

          </div>

        </section>

        {/* LOWER CONTENT */}
        <section className="content lower-section">

          <div className="lower-grid">

            <article className="explainer">

              <div className="section-header">

                <h2>
                  💡 Explainers
                </h2>

                <a href="#">
                  View all →
                </a>

              </div>

              <div className="explainer-content">

                <div className="explainer-art">
                  ₦
                </div>

                <div>

                  <h3>
                    Why Electricity Bills Keep Rising in Nigeria
                  </h3>

                  <p>
                    A simple breakdown of what's happening
                    and what it means for you.
                  </p>

                  <a href="#">
                    Read explainer →
                  </a>

                </div>

              </div>

            </article>

          <Suspense
            fallback={
              <article className="cartoon">
                <div className="section-header">
                  <h2>
                    🎨 Cartoon of the Day
                  </h2>
                </div>

                <div className="cartoon-empty">
                  <div className="cartoon-empty-mark">
                    🎨
                  </div>

                  <strong>
                    Loading Cartoon of the Day...
                  </strong>

                  <p>
                    Preparing the latest NaijaLaughs comic reaction.
                  </p>
                </div>
              </article>
            }
          >
            <HomepageCartoon />
          </Suspense>
        
        </div>

        </section>

        {/* FOOTER */}
        <footer
          className="footer"
          id="subscribe"
        >

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

              <h3>
                Explore
              </h3>

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

              <h3>
                More
              </h3>

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
                <br />
                About Us
              </p>

            </div>

            <div>

              <h3>
                Stay Updated
              </h3>

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