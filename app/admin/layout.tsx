import { Suspense } from "react";
import "./admin.css";
import AdminShell from "./AdminShell";

function AdminShellLoading() {
  return (
    <main className="admin-shell">

      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">

          <span>
            Naija<span>Laughs</span>
          </span>

          <small>
            CONTENT MANAGEMENT
          </small>

        </div>

      </aside>


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

        </header>


        <main className="admin-main-content">

          <section className="sources-loading">

            <span />

            <h1>
              Loading Editorial Desk
            </h1>

            <p>
              Preparing the newsroom workspace...
            </p>

          </section>

        </main>

      </div>

    </main>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminShellLoading />}>

      <AdminShell>
        {children}
      </AdminShell>

    </Suspense>
  );
}