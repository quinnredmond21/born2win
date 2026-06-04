"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BASELINE_METRICS, type BaselineEntry } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ProgressPage() {
  const [entries, setEntries] = useState<BaselineEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState(BASELINE_METRICS[0].key);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [workoutCount, setWorkoutCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [baselineResult, logsResult] = await Promise.all([
        supabase
          .from("baseline_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: true }),
        supabase
          .from("workout_logs")
          .select("id")
          .eq("user_id", user.id),
      ]);

      setEntries((baselineResult.data ?? []) as BaselineEntry[]);
      setWorkoutCount(logsResult.data?.length ?? 0);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);

    const res = await fetch("/api/baselines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric: selectedMetric, value }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setSaveError(data.error ?? "Failed to save.");
      return;
    }

    setSaveSuccess(true);
    setValue("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("baseline_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true });
      setEntries((data ?? []) as BaselineEntry[]);
    }
  }

  const metricDef = BASELINE_METRICS.find((m) => m.key === selectedMetric)!;
  const chartData = entries
    .filter((e) => e.metric === selectedMetric)
    .map((e) => ({
      date: new Date(e.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: e.value,
    }));

  const latestByMetric = BASELINE_METRICS.map((m) => {
    const latest = entries.filter((e) => e.metric === m.key).at(-1);
    return { ...m, latest };
  }).filter((m) => m.latest);

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Progress</h1>
        <p className="text-gray-400 text-sm">
          {workoutCount} total workout{workoutCount === 1 ? "" : "s"} logged.
        </p>
      </div>

      <section className="border border-gray-800 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Log a Baseline</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Test</label>
            <select
              value={selectedMetric}
              onChange={(e) => { setSelectedMetric(e.target.value); setSaveSuccess(false); }}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            >
              {BASELINE_METRICS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-500 leading-relaxed">
            {metricDef.description}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Your result ({metricDef.unit})
            </label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              placeholder={metricDef.unit === "seconds" ? "e.g. 4.52" : "e.g. 225"}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            />
          </div>

          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
          {saveSuccess && <p className="text-green-400 text-xs">Saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black font-bold px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Log result"}
          </button>
        </form>
      </section>

      {chartData.length >= 2 && (
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            {metricDef.label} over time
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #374151", color: "#fff", fontSize: 12 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={{ fill: "#ffffff", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {latestByMetric.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Current Bests</h2>
          <div className="grid grid-cols-2 gap-3">
            {latestByMetric.map((m) => (
              <div key={m.key} className="border border-gray-800 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className="text-white font-bold">
                  {m.latest!.value}{" "}
                  <span className="text-gray-500 font-normal text-xs">{m.unit}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {entries.length === 0 && (
        <p className="text-gray-500 text-sm">
          No baselines logged yet. Use the form above to record your first result.
        </p>
      )}
    </div>
  );
}
