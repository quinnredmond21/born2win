"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  challengeId: string;
  metricLabel: string;
  existingScore: number | null;
};

export default function ChallengeSubmitForm({ challengeId, metricLabel, existingScore }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(existingScore?.toString() ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch(`/api/challenges/${challengeId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to submit.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-bold text-white">
        {existingScore !== null ? "Update your score" : "Submit your score"}
      </h3>
      {existingScore !== null && (
        <p className="text-gray-500 text-xs">Current submission: {existingScore}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">{metricLabel}</label>
          <input
            type="number"
            step="any"
            value={score}
            onChange={(e) => { setScore(e.target.value); setSuccess(false); }}
            required
            placeholder="Your result"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-white text-black font-bold px-4 py-2 rounded text-sm disabled:opacity-50 shrink-0"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">Score submitted. Leaderboard updated.</p>}
    </div>
  );
}
