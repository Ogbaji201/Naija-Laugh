import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import "./article.css";

type Article = {
  id: string;
  headline: string;
  standfirst: string | null;
  body: string | null;
  slug: string;
  status: string;
  published_at: string | null;
};

function formatPublishedDate(value: string | null) {
  if (!value) return "Recently published";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

async function ArticleContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article, error } = await supabase
    .from("articles")
    .select(`
      id,
      headline,
      standfirst,
      body,
      slug,
      status,
      published_at
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(
      "Article fetch error:",
      JSON.stringify(error, null, 2)
    );
  }

  if (!article) {
    notFound();
  }

  const publishedArticle = article as Article;

  const paragraphs = (publishedArticle.body ?? "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <main className="article-page">
      <div className="article-page-shell">

        <Link href="/" className="article-back-link">
          ← Back to NaijaLaughs
        </Link>

        <article className="article-card">
          <header className="article-header">

            <div className="article-category">
              NEWS
            </div>

            <h1 className="article-title">
              {publishedArticle.headline}
            </h1>

            {publishedArticle.standfirst && (
              <p className="article-standfirst">
                {publishedArticle.standfirst}
              </p>
            )}

            <div className="article-meta">
              <span>By NaijaLaughs Team</span>
              <span className="article-meta-dot">•</span>
              <time dateTime={publishedArticle.published_at ?? undefined}>
                {formatPublishedDate(publishedArticle.published_at)}
              </time>
            </div>
          </header>

          <div className="article-divider" />

          <div className="article-body">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => (
                <p key={`${publishedArticle.id}-${index}`}>
                  {paragraph}
                </p>
              ))
            ) : (
              <p>
                This story has been published, but the article body is
                currently unavailable.
              </p>
            )}
          </div>

          <footer className="article-footer">
            <Link href="/" className="article-home-button">
              ← Back to Latest News
            </Link>
          </footer>
        </article>
      </div>
    </main>
  );
}

function ArticleLoading() {
  return (
    <main className="article-page">
      <div className="article-page-shell">
        <div className="article-loading-card">
          <span className="loading-label" />
          <span className="loading-title" />
          <span className="loading-title short" />
          <span className="loading-text" />
          <span className="loading-text short" />
        </div>
      </div>
    </main>
  );
}

export default function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<ArticleLoading />}>
      <ArticleContent params={params} />
    </Suspense>
  );
}
