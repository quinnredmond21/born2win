"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewChallengePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("");
  const [metricLabel, setMetricLabel] = useState("");
  const [metricDirection, setMetricDirection] = useState<"asc" | "desc">("desc");
  const [instructions, setInstructions] = useState("");
  const [howToRecord, setHowToRecord] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/coach/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        metric,
        metric_label: metricLabel,
        metric_direction: metricDirection,
        instructions,
        how_to_record: howToRecord,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
      return;
    }

    router.push("/coach/challenges");
  }

  const inputClass = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/coach/challenges" className="text-gray-500 text-sm hover:text-white">
          Back to challenges
        </Link>
        <h1 className="text-2xl font-black text-white mt-3">New Challenge</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Challenge name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. June Pushup Challenge" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} placeholder="Brief description shown to athletes" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Metric key (no spaces)</label>
            <input
              type="text"
              value={metric}
              onChange={(e) => setMetric(e.target.value.toLowerCase().replace(/\s/g, "_"))}
              required
              placeholder="e.g. pushups_60"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Metric label</label>
            <input type="text" value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} required placeholder="e.g. Pushups in 60 sec" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Scoring direction</label>
          <select value={metricDirection} onChange={(e) => setMetricDirection(e.target.value as "asc" | "desc")} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white">
            <option value="desc">Higher is better (reps, distance, weight)</option>
            <option value="asc">Lower is better (time)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Instructions (shown to athletes)</label>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} required rows={3} placeholder="Describe exactly how to perform the challenge" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">How to record your score</label>
          <textarea value={howToRecord} onChange={(e) => setHowToRecord(e.target.value)} required rows={2} placeholder="e.g. Count total reps completed in 60 seconds" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start date</label>
            <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End date</label>
            <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required className={inputClass} />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-white text-black font-bold px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Create challenge"}
          </button>
          <Link href="/coach/challenges" className="border border-gray-700 text-gray-400 px-4 py-2 rounded text-sm hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
