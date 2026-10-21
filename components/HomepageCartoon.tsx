import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

type Cartoon = {
  id: string;
  image_url: string | null;
  alt_text: string | null;
  caption: string | null;
  concept: string | null;
  published_at: string | null;
  article: {
    headline: string | null;
    slug: string | null;
  } | null;
};

export default async function HomepageCartoon() {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from("cartoons")
    .select(`
      id,
      image_url,
      alt_text,
      caption,
      concept,
      published_at,
      article:articles (
        headline,
        slug
      )
    `)
    .eq("status", "published")
    .eq("is_cartoon_of_day", true)
    .order("published_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Homepage Cartoon of the Day fetch error:",
      error
    );
  }

  const cartoon = data as Cartoon | null;

  return (
    <article className="cartoon">
      <div className="section-header">
        <h2>
          🎨 Cartoon of the Day
        </h2>

        <Link href="/cartoons">
          View all →
        </Link>
      </div>

      {cartoon?.image_url ? (
        <>
          <Link
            href="/cartoons"
            className="cartoon-live-image-link"
          >
            <div className="cartoon-live-image">
              <img
                src={cartoon.image_url}
                alt={
                  cartoon.alt_text ||
                  "NaijaLaughs Cartoon of the Day"
                }
              />
            </div>
          </Link>

          <div className="cartoon-live-copy">
            <strong>
              {cartoon.caption ||
                cartoon.concept ||
                "Comic reaction"}
            </strong>

            {cartoon.article?.slug &&
              cartoon.article.headline && (
                <Link
                  href={`/article/${cartoon.article.slug}`}
                >
                  Inspired by:{" "}
                  {cartoon.article.headline}
                </Link>
              )}
          </div>
        </>
      ) : (
        <div className="cartoon-empty">
          <div className="cartoon-empty-mark">
            🎨
          </div>

          <strong>
            No Cartoon of the Day yet
          </strong>

          <p>
            Check back soon for the latest NaijaLaughs
            comic reaction.
          </p>
        </div>
      )}

      <small>
        AI-generated illustration • Comic reaction
      </small>
    </article>
  );
}