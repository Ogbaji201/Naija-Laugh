"use client";

import { useState } from "react";

type RssSource = {
  id: string;
  name: string;
};

type IntakeResult = {
  source: string;
  fetched: number;
  inserted: number;
  duplicates: number;
  failed: number;
};

export default function FetchRssButton({
  sources,
}: {
  sources: RssSource[];
}) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<IntakeResult[]>([]);
  const [error, setError] = useState("");

  async function handleFetch() {
    setLoading(true);
    setError("");
    setResults([]);

    const intakeResults: IntakeResult[] = [];

    try {
      for (const source of sources) {
        const response = await fetch(
          "/api/admin/news/intake/rss",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sourceId: source.id,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            `${source.name}: ${
              data.error || "RSS ingestion failed."
            }`
          );
        }

        intakeResults.push({
          source: data.source || source.name,
          fetched: data.fetched ?? 0,
          inserted: data.inserted ?? 0,
          duplicates: data.duplicates ?? 0,
          failed: data.failed ?? 0,
        });

        setResults([...intakeResults]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "RSS intake failed."
      );
    } finally {
      setLoading(false);
    }
  }

  const totalInserted = results.reduce(
    (total, result) => total + result.inserted,
    0
  );

  const totalFetched = results.reduce(
    (total, result) => total + result.fetched,
    0
  );

  const totalDuplicates = results.reduce(
    (total, result) => total + result.duplicates,
    0
  );

  if (sources.length === 0) {
    return null;
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleFetch}
        disabled={loading}
        className="admin-accent-button"
      >
        {loading ? "Fetching News..." : "Fetch Latest News"}
      </button>

      {results.length > 0 && !loading && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          <strong>RSS intake complete.</strong>
          <br />
          {totalFetched} fetched · {totalInserted} new ·{" "}
          {totalDuplicates} duplicates
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "10px",
            fontSize: "12px",
            lineHeight: 1.5,
          }}
        >
          <strong>RSS intake error:</strong> {error}
        </div>
      )}
    </div>
  );
}