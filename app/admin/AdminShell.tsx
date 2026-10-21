"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const newsActive =
    pathname.startsWith("/admin/news");

  return (
    <main className="admin-shell">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">

          <Link href="/">
            Naija<span>Laughs</span>
          </Link>

          <small>
            CONTENT MANAGEMENT
          </small>

        </div>


        <nav className="admin-sidebar-nav">

          <div className="admin-nav-label">
            WORKSPACE
          </div>


          {/* DASHBOARD */}

          <Link
            href="/admin"
            className={
              pathname === "/admin"
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="nav-code">
              DB
            </span>

            Dashboard
          </Link>


          {/* NEWS */}

          <Link
            href="/admin/news?status=needs_review"
            className={
              newsActive
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="nav-code">
              NW
            </span>

            News
          </Link>


          {/* NEWS SUBNAV */}

          {newsActive && (
            <div className="admin-news-subnav">

              <Link
                href="/admin/news?status=needs_review"
                className={
                  pathname === "/admin/news"
                    ? "admin-news-subnav-link active"
                    : "admin-news-subnav-link"
                }
              >
                Review
              </Link>


              <Link
                href="/admin/news/intake"
                className={
                  pathname === "/admin/news/intake"
                    ? "admin-news-subnav-link active"
                    : "admin-news-subnav-link"
                }
              >
                Intake
              </Link>


              <Link
                href="/admin/news/sources"
                className={
                  pathname === "/admin/news/sources"
                    ? "admin-news-subnav-link active"
                    : "admin-news-subnav-link"
                }
              >
                Sources
              </Link>


              <Link
                href="/admin/news/stories"
                className={
                  pathname === "/admin/news/stories" ||
                  pathname.startsWith(
                    "/admin/news/stories/"
                  )
                    ? "admin-news-subnav-link active"
                    : "admin-news-subnav-link"
                }
              >
                Stories
              </Link>

            </div>
          )}


          {/* JOBS */}

          <Link
            href="/admin/jobs"
            className={
              pathname.startsWith("/admin/jobs")
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="nav-code">
              JB
            </span>

            Jobs
          </Link>


          {/* CARTOONS */}

          <Link
            href="/admin/cartoons"
            className={
              pathname.startsWith("/admin/cartoons")
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="nav-code">
              CT
            </span>

            Cartoons
          </Link>


          {/* TRENDING */}

          <Link
            href="/admin/trending"
            className={
              pathname.startsWith("/admin/trending")
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="nav-code">
              TR
            </span>

            Trending
          </Link>


          {/* SYSTEM */}

          <div className="admin-nav-label second">
            SYSTEM
          </div>


          <Link
            href="/"
            className="admin-nav-link"
          >
            <span className="nav-code">
              WE
            </span>

            View Website
          </Link>


          <Link
            href="/admin/settings"
            className={
              pathname.startsWith("/admin/settings")
                ? "admin-nav-link active"
                : "admin-nav-link"
            }
          >
            <span className="nav-code">
              ST
            </span>

            Settings
          </Link>

        </nav>


        {/* =====================================================
            SIDEBAR FOOTER
            ===================================================== */}

        <div className="admin-sidebar-footer">

          <div className="admin-user-status">

            <span className="status-dot" />

            <div>

              <strong>
                Admin session
              </strong>

              <small>
                Authenticated
              </small>

            </div>

          </div>

        </div>

      </aside>


      {/* =====================================================
          WORKSPACE
          ===================================================== */}

      <div className="admin-workspace">

        <header className="admin-topbar">

          <div>

            <span className="admin-breadcrumb">
              Workspace
            </span>

            <h1>
              Editorial Desk
            </h1>

          </div>


          <div className="admin-topbar-actions">

            <Link
              href="/"
              className="admin-outline-button"
            >
              View Website
            </Link>

            <Link
              href="/admin"
              className="admin-accent-button"
            >
              Dashboard
            </Link>

          </div>

        </header>


        {children}

      </div>

    </main>
  );
}