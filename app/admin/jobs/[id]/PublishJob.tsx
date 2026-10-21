"use client";

import { useState } from "react";

type PublishJobProps = {
  jobId: string;
  status: string;
};

export default function PublishJob({
  jobId,
  status,
}: PublishJobProps) {
  const [currentStatus, setCurrentStatus] =
    useState(status);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function publishJob() {
    const confirmed = window.confirm(
      "Are you sure you want to publish this job? It will become visible on the public Jobs page."
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/jobs/${jobId}/publish`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to publish the job."
        );
      }

      setCurrentStatus("published");

      setMessage(
        "Job published successfully. It is now visible on the public Jobs page."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "published") {
    return (
      <div className="jobs-admin-publish-panel jobs-admin-publish-panel-live">
        <div>
          <span className="jobs-admin-ai-label">
            Publication Status
          </span>

          <strong>
            Published
          </strong>

          <p>
            This job is currently visible on the public
            Jobs page.
          </p>
        </div>
      </div>
    );
  }

  if (currentStatus !== "approved") {
    return (
      <div className="jobs-admin-publish-panel">
        <div>
          <span className="jobs-admin-ai-label">
            Publication
          </span>

          <strong>
            Not ready to publish
          </strong>

          <p>
            This job must be approved by an administrator
            before it can be published.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="jobs-admin-publish-panel jobs-admin-publish-ready">
      <div>
        <span className="jobs-admin-ai-label">
          Publication
        </span>

        <strong>
          Ready to publish
        </strong>

        <p>
          This job has been approved by an administrator
          and is ready to go live.
        </p>
      </div>

      <button
        type="button"
        className="jobs-admin-publish-button"
        onClick={publishJob}
        disabled={loading}
      >
        {loading ? "Publishing..." : "Publish Job"}
      </button>

      {error && (
        <div className="jobs-admin-publish-error">
          {error}
        </div>
      )}

      {message && (
        <div className="jobs-admin-publish-success">
          {message}
        </div>
      )}
    </div>
  );
}