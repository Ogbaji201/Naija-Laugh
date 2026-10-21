"use client";

import { useEffect, useState } from "react";

type JobAIReviewProps = {
  jobId: string;
  initialStatus: string | null;
  initialNotes: string | null;
  initialConfidence: number | null;
  initialModel: string | null;
  initialReviewedAt: string | null;
};

export default function JobAIReview({
  jobId,
  initialStatus,
  initialNotes,
  initialConfidence,
  initialModel,
  initialReviewedAt,
}: JobAIReviewProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [confidence, setConfidence] =
    useState(initialConfidence);
  const [model, setModel] = useState(initialModel);
  const [reviewedAt, setReviewedAt] =
    useState(initialReviewedAt);

  const [loading, setLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] =
    useState(false);
  const [error, setError] = useState("");
  const [decisionMessage, setDecisionMessage] =
    useState("");

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function runAIReview() {
    setLoading(true);
    setError("");
    setDecisionMessage("");

    try {
      const response = await fetch(
        `/api/admin/jobs/${jobId}/review`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to run AI review."
        );
      }

      setStatus(
        data.review.recommendation === "approve"
          ? "reviewed"
          : data.review.recommendation === "flag"
            ? "flagged"
            : "rejected"
      );

      setNotes(
        [
          data.review.summary
            ? `Summary: ${data.review.summary}`
            : "",
          data.review.notes?.length
            ? `Notes:\n${data.review.notes
                .map(
                  (item: string) => `• ${item}`
                )
                .join("\n")}`
            : "",
          data.review.red_flags?.length
            ? `Red Flags:\n${data.review.red_flags
                .map(
                  (item: string) => `• ${item}`
                )
                .join("\n")}`
            : "",
          data.review.missing_information?.length
            ? `Missing Information:\n${data.review.missing_information
                .map(
                  (item: string) => `• ${item}`
                )
                .join("\n")}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      );

      setConfidence(data.review.confidence);
      setModel(data.job.ai_model);
      setReviewedAt(data.job.ai_reviewed_at);
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

  async function makeDecision(
    decision: "approve" | "flag" | "reject"
  ) {
    setDecisionLoading(true);
    setError("");
    setDecisionMessage("");

    try {
      const response = await fetch(
        `/api/admin/jobs/${jobId}/review/decision`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to save the administrator decision."
        );
      }

      setDecisionMessage(
        decision === "approve"
          ? "Job approved. It remains unpublished until you choose to publish it."
          : decision === "flag"
            ? "Job moved to review."
            : "Job rejected and remains unpublished."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setDecisionLoading(false);
    }
  }

  const recommendationLabel =
    status === "reviewed"
      ? "AI recommends approval"
      : status === "flagged"
        ? "AI recommends review"
        : status === "rejected"
          ? "AI recommends rejection"
          : "Not reviewed";

  return (
    <section className="jobs-admin-form-section jobs-admin-ai-section">
      <div className="jobs-admin-form-section-heading">
        <div>
          <h2>AI Review</h2>

          <p>
            Use AI to assess the quality and completeness of
            this job listing. Final publishing remains a human
            decision.
          </p>
        </div>

        <button
          type="button"
          className="jobs-admin-primary-button"
          onClick={runAIReview}
          disabled={loading || decisionLoading}
        >
          {loading ? "Reviewing..." : "Run AI Review"}
        </button>
      </div>

      {error && (
        <div className="jobs-admin-ai-error">
          {error}
        </div>
      )}

      {decisionMessage && (
        <div className="jobs-admin-ai-success">
          {decisionMessage}
        </div>
      )}

      <div className="jobs-admin-ai-result">
        <div className="jobs-admin-ai-status-row">
          <div>
            <span className="jobs-admin-ai-label">
              Recommendation
            </span>

            <strong
              className={`jobs-admin-ai-status jobs-admin-ai-status-${
                status || "pending"
              }`}
            >
              {recommendationLabel}
            </strong>
          </div>

          <div>
            <span className="jobs-admin-ai-label">
              Confidence
            </span>

            <strong>
              {confidence !== null
                ? `${confidence}%`
                : "—"}
            </strong>
          </div>

          <div>
            <span className="jobs-admin-ai-label">
              Model
            </span>

            <strong>
              {model || "—"}
            </strong>
          </div>
        </div>

        {notes ? (
          <div className="jobs-admin-ai-notes">
            <span className="jobs-admin-ai-label">
              Assessment
            </span>

            <div className="jobs-admin-ai-notes-content">
              {notes
                .split("\n")
                .map((line, index) => (
                  <p key={index}>
                    {line || "\u00A0"}
                  </p>
                ))}
            </div>
          </div>
        ) : (
          <div className="jobs-admin-ai-empty">
            This job has not been reviewed by AI yet.
          </div>
        )}

        {reviewedAt && mounted && (
          <div className="jobs-admin-ai-reviewed">
            Last reviewed:{" "}
            {new Date(reviewedAt).toLocaleString()}
          </div>
        )}

        {/* Human decision controls */}

        <div className="jobs-admin-ai-decision">
          <div>
            <span className="jobs-admin-ai-label">
              Human Decision
            </span>

            <p className="jobs-admin-ai-decision-help">
              Review the AI assessment and make the final
              editorial decision. Approval does not publish
              the job.
            </p>
          </div>

          <div className="jobs-admin-ai-decision-actions">
            <button
              type="button"
              className="jobs-admin-ai-decision-button jobs-admin-ai-approve"
              onClick={() => makeDecision("approve")}
              disabled={
                decisionLoading || !reviewedAt
              }
            >
              Approve
            </button>

            <button
              type="button"
              className="jobs-admin-ai-decision-button jobs-admin-ai-flag"
              onClick={() => makeDecision("flag")}
              disabled={
                decisionLoading || !reviewedAt
              }
            >
              Needs Review
            </button>

            <button
              type="button"
              className="jobs-admin-ai-decision-button jobs-admin-ai-reject"
              onClick={() => makeDecision("reject")}
              disabled={
                decisionLoading || !reviewedAt
              }
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}