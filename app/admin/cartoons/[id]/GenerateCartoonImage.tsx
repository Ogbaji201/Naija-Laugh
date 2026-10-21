"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GenerateCartoonImageProps = {
  cartoonId: string;
  canGenerate: boolean;
  regenerate?: boolean;
};

export default function GenerateCartoonImage({
  cartoonId,
  canGenerate,
  regenerate = false,
}: GenerateCartoonImageProps) {
  const router = useRouter();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!canGenerate || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/cartoons/${cartoonId}/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to generate the cartoon image."
        );
      }

      router.refresh();
    } catch (error) {
      console.error(
        "Cartoon image generation error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to generate the cartoon image."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!canGenerate) {
    return (
      <div>
        <button
          type="button"
          className="cartoons-secondary-button"
          disabled
          style={{
            opacity: 0.5,
            cursor: "not-allowed",
          }}
        >
          {regenerate
            ? "Regenerate AI Image"
            : "Generate AI Image"}
        </button>

        <p
          style={{
            margin: "9px 0 0",
            color: "#858a8f",
            fontSize: "9px",
            lineHeight: "1.5",
          }}
        >
          The cartoon must be approved before an AI
          image can be generated.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className="cartoons-save-button"
        style={
          isGenerating
            ? {
                opacity: 0.65,
                cursor: "wait",
              }
            : undefined
        }
      >
        {isGenerating
          ? "Generating AI Image..."
          : regenerate
            ? "Regenerate AI Image"
            : "Generate AI Image"}
      </button>

      {isGenerating && (
        <p
          style={{
            margin: "10px 0 0",
            color: "#858a8f",
            fontSize: "9px",
            lineHeight: "1.5",
          }}
        >
          Creating the editorial illustration. This may
          take a moment.
        </p>
      )}

      {error && (
        <div
          style={{
            marginTop: "12px",
            padding: "11px 13px",
            border: "1px solid #e1c6c6",
            background: "#fbf3f3",
            color: "#8a4141",
            fontSize: "9px",
            lineHeight: "1.5",
          }}
        >
          <strong>Image generation failed.</strong>

          <p
            style={{
              margin: "4px 0 0",
            }}
          >
            {error}
          </p>
        </div>
      )}
    </div>
  );
}