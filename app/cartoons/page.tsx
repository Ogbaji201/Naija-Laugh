import { Suspense } from "react";
import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

import "./cartoons.css";

type Cartoon = {
  id: string;
  concept: string | null;
  image_url: string | null;
  alt_text: string | null;
  caption: string | null;
  status: string;
  is_cartoon_of_day: boolean;
  published_at: string | null;
  created_at: string;
  article: {
    id: string;
    headline: string | null;
    slug: string | null;
  } | null;
};

function formatDate(date: string | null) {
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

async function getPublishedCartoons(): Promise<Cartoon[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("cartoons")
    .select(`
      id,
      concept,
      image_url,
      alt_text,
      caption,
      status,
      is_cartoon_of_day,
      published_at,
      created_at,
      article:articles (
        id,
        headline,
        slug
      )
    `)
    .eq("status", "published")
    .order("published_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load published cartoons:",
      error
    );

    return [];
  }

    return (data ?? []).map((item) => {
    const articleData = Array.isArray(item.article)
    ? item.article[0] ?? null
    : item.article;

    return {
      id: item.id,
      concept: item.concept,
      image_url: item.image_url,
      alt_text: item.alt_text,
      caption: item.caption,
      status: item.status,
      is_cartoon_of_day: item.is_cartoon_of_day,
      published_at: item.published_at,
      created_at: item.created_at,
      article: articleData
        ? {
            id: articleData.id,
            headline: articleData.headline,
            slug: articleData.slug,
          }
        : null,
    };
  });
}
 

function CartoonsLoading() {
  return (
    <main className="public-cartoons-page">
      <section className="public-cartoons-hero">
        <div className="public-cartoons-container">
          <span className="public-cartoons-eyebrow">
            NAIJALAUGHS / CARTOONS
          </span>

          <h1>Cartoons</h1>

          <p>
            Same news. More wahala. Our AI-generated
            comic reactions to the stories Nigerians
            are talking about.
          </p>
        </div>
      </section>

      <section className="public-cartoons-container">
        <div className="cartoons-loading-grid">
          <div />
          <div />
          <div />
        </div>
      </section>
    </main>
  );
}

async function CartoonsContent() {
  const cartoons = await getPublishedCartoons();

  return (
    <main className="public-cartoons-page">
      <section className="public-cartoons-hero">
        <div className="public-cartoons-container">
          <span className="public-cartoons-eyebrow">
            NAIJALAUGHS / CARTOONS
          </span>

          <h1>Cartoons</h1>

          <p>
            Same news. More wahala. Our AI-generated
            comic reactions to the stories Nigerians
            are talking about.
          </p>
        </div>
      </section>

      <section className="public-cartoons-container public-cartoons-content">
        <div className="public-cartoons-section-heading">
          <div>
            <span className="public-cartoons-section-label">
              THE COMIC ARCHIVE
            </span>

            <h2>
              Latest cartoons
            </h2>
          </div>

          <span className="public-cartoons-count">
            {cartoons.length}{" "}
            {cartoons.length === 1
              ? "cartoon"
              : "cartoons"}
          </span>
        </div>

        {cartoons.length === 0 ? (
          <section className="public-cartoons-empty">
            <div className="public-cartoons-empty-mark">
              CT
            </div>

            <h3>
              No cartoons published yet
            </h3>

            <p>
              Our editorial cartoon archive will appear
              here as cartoons are approved and published.
            </p>

            <Link
              href="/"
              className="public-cartoons-button"
            >
              Back to homepage
            </Link>
          </section>
        ) : (
          <div className="public-cartoons-grid">
            {cartoons.map((cartoon) => (
              <article
                key={cartoon.id}
                className="public-cartoon-card"
              >
                <div className="public-cartoon-image-wrap">
                  {cartoon.image_url ? (
                    <img
                      src={cartoon.image_url}
                      alt={
                        cartoon.alt_text ||
                        "NaijaLaughs editorial cartoon"
                      }
                      className="public-cartoon-image"
                    />
                  ) : (
                    <div className="public-cartoon-no-image">
                      <span>AI</span>
                      <p>
                        Illustration unavailable
                      </p>
                    </div>
                  )}

                  {cartoon.is_cartoon_of_day && (
                    <span className="public-cartoon-day-badge">
                      CARTOON OF THE DAY
                    </span>
                  )}
                </div>

                <div className="public-cartoon-card-body">
                  <span className="public-cartoon-label">
                    AI-GENERATED ILLUSTRATION
                    <span>•</span>
                    COMIC REACTION
                  </span>

                  <h3>
                    {cartoon.caption ||
                      cartoon.concept ||
                      "Comic reaction"}
                  </h3>

                  {cartoon.article?.headline && (
                    <div className="public-cartoon-story">
                      <span>
                        INSPIRED BY
                      </span>

                      {cartoon.article.slug ? (
                        <Link
                          href={`/article/${cartoon.article.slug}`}
                        >
                          {cartoon.article.headline}
                        </Link>
                      ) : (
                        <p>
                          {cartoon.article.headline}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="public-cartoon-meta">
                    <span>
                      {formatDate(
                        cartoon.published_at ||
                          cartoon.created_at
                      )}
                    </span>

                    <span>
                      Satire / Comic reaction
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function CartoonsPage() {
  return (
    <Suspense
      fallback={<CartoonsLoading />}
    >
      <CartoonsContent />
    </Suspense>
  );
}