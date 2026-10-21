import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import "./category.css";

type Category = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

type Article = {
  id: string;
  headline: string;
  standfirst: string | null;
  slug: string;
  published_at: string | null;
};

const navigation = [
  ["Home", "/"],
  ["Nigeria", "/category/nigeria"],
  ["Africa", "/category/africa"],
  ["World", "/category/world"],
  ["Business", "/category/business"],
  ["Sports", "/category/sports"],
  ["Entertainment", "/category/entertainment"],
  ["Tech", "/category/tech"],
  ["Funny", "/category/funny"],
  ["Explainers", "/category/explainers"],
];

function formatDate(value: string | null) {
  if (!value) return "Recently";

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

async function CategoryContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id, name, slug, is_active")
    .eq("slug", slug)
    .maybeSingle();

  if (categoryError) {
    console.error(
      "Category fetch error:",
      JSON.stringify(categoryError, null, 2)
    );
  }

  if (!category) {
    notFound();
  }

  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select(`
      id,
      headline,
      standfirst,
      slug,
      published_at
    `)
    .eq("category_id", category.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (articlesError) {
    console.error(
      "Category articles fetch error:",
      JSON.stringify(articlesError, null, 2)
    );
  }

  const publishedArticles = (articles ?? []) as Article[];
  const currentCategory = category as Category;

  return (
    <main className="category-page">
      <header className="category-site-header">
        <div className="category-header-inner">
          <Link href="/" className="category-logo">
            Naija<span>Laughs</span>
          </Link>

          <nav className="category-nav" aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={
                  href === `/category/${currentCategory.slug}`
                    ? "active"
                    : ""
                }
              >
                {label}
              </Link>
            ))}

            <Link href="/trending" className="trending-link">
              🔥 Trending
            </Link>
          </nav>
        </div>
      </header>

      <section className="category-hero">
        <div>
          <span className="category-kicker">NATIONAL NEWSROOM</span>
          <h1>{currentCategory.name}</h1>
          <p>
            The latest stories, developments and Nigerian-angle coverage from
            NaijaLaughs.
          </p>
        </div>
      </section>

      <section className="category-content">
        <div className="category-heading">
          <div>
            <span>LATEST</span>
            <h2>Latest {currentCategory.name} News</h2>
          </div>

          <Link href="/">← Back to Home</Link>
        </div>

        {publishedArticles.length > 0 ? (
          <div className="category-grid">
            {publishedArticles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className="category-card"
              >
                <div className="category-card-art">
                  <span>
                    {currentCategory.name.slice(0, 1).toUpperCase()}
                  </span>
                </div>

                <div className="category-card-content">
                  <span className="category-card-label">
                    {currentCategory.name.toUpperCase()}
                  </span>

                  <h3>{article.headline}</h3>

                  {article.standfirst && (
                    <p>{article.standfirst}</p>
                  )}

                  <small>
                    {formatDate(article.published_at)}
                  </small>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="category-empty">
            <span>NEWSROOM</span>
            <h3>No published stories in this category yet.</h3>
            <p>
              Once a story is reviewed and published under this category, it
              will appear here automatically.
            </p>
            <Link href="/">Return to NaijaLaughs →</Link>
          </div>
        )}
      </section>
    </main>
  );
}

function CategoryLoading() {
  return (
    <main className="category-page">
      <div className="category-loading">
        <span />
        <div />
        <div />
      </div>
    </main>
  );
}

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<CategoryLoading />}>
      <CategoryContent params={params} />
    </Suspense>
  );
}
