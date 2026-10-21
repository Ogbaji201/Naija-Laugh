"use client";

import { useState } from "react";

type GenerateDraftButtonProps = {
  storyId: string;
  disabled?: boolean;
};

export default function GenerateDraftButton({
  storyId,
  disabled = false,
}: GenerateDraftButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generateDraft() {
    console.log("GENERATE BUTTON CLICKED");
    console.log("Story ID:", storyId);
    console.log("Button disabled:", disabled);

    if (isGenerating) {
      console.log("Already generating - stopping.");
      return;
    }

    setIsGenerating(true);
    setMessage(null);
    setError(null);

    try {
      console.log("Calling draft API...");

      const response = await fetch(
        `/api/admin/news/stories/${storyId}/draft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API response status:", response.status);

      const result = await response.json();

      console.log("API response:", result);

      if (!response.ok) {
        throw new Error(
          result?.error || "Draft generation failed."
        );
      }

      setMessage(
        `Draft version ${result.draft.version} created successfully.`
      );

      window.setTimeout(() => {
        window.location.href =
          "/admin/news?status=needs_review";
      }, 900);
    } catch (error) {
      console.error("Generate draft error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Draft generation failed."
      );

      setIsGenerating(false);
    }
  }

  return (
    <div className="generate-draft-action">
      <button
        type="button"
        className="admin-accent-button"
        onClick={generateDraft}
        disabled={disabled || isGenerating}
      >
        {isGenerating
          ? "Generating Draft..."
          : "Generate AI Draft"}
      </button>

      {isGenerating && (
        <p className="generate-draft-status">
          Reviewing the attached source material and
          preparing the first editorial draft...
        </p>
      )}

      {message && (
        <p className="generate-draft-success">
          {message}
        </p>
      )}

      {error && (
        <p className="generate-draft-error">
          {error}
        </p>
      )}
    </div>
  );
}