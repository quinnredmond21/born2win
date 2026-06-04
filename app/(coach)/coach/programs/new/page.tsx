"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Workout } from "@/lib/types";

const DAYS = [
  "Week 1 - Monday", "Week 1 - Wednesday", "Week 1 - Friday",
  "Week 2 - Monday", "Week 2 - Wednesday", "Week 2 - Friday",
  "Week 3 - Monday", "Week 3 - Wednesday", "Week 3 - Friday",
  "Week 4 - Monday", "Week 4 - Wednesday", "Week 4 - Friday",
];

function dayKey(day: string) {
  return day.toLowerCase().replace(/ - /g, "_").replace(/ /g, "_");
}

export default function NewProgramPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"free" | "paid">("paid");
  const [schedule, setSchedule] = useState<Record<string, string[]>>({});
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("workouts").select("id, name, tier").order("name").then(({ data }) => {
      setWorkouts((data ?? []) as Workout[]);
    });
  }, []);

  function toggleWorkout(day: string, workoutId: string) {
    setSchedule((prev) => {
      const current = prev[day] ?? [];
      const next = current.includes(workoutId)
        ? current.filter((id) => id !== workoutId)
        : [...current, workoutId];
      return { ...prev, [day]: next };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const cleanSchedule = Object.fromEntries(
      Object.entries(schedule).filter(([, ids]) => ids.length > 0)
    );

    const res = await fetch("/api/coach/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, tier, schedule: cleanSchedule }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
      return;
    }

    router.push("/coach/programs");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/coach/programs" className="text-gray-500 text-sm hover:text-white">
          Back to programs
        </Link>
        <h1 className="text-2xl font-black text-white mt-3">New Program</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Program name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. 4-Week Speed Program" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Access tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as "free" | "paid")} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white">
              <option value="paid">Paid only</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Schedule</h2>
          <p className="text-xs text-gray-500">Select which workouts appear on each training day. Days with no workouts selected are skipped.</p>

          {DAYS.map((day) => {
            const key = dayKey(day);
            const selectedIds = schedule[key] ?? [];
            return (
              <div key={key} className="border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-medium mb-2">{day}</p>
                <div className="space-y-1">
                  {workouts.map((w) => (
                    <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.includes(w.id)} onChange={() => toggleWorkout(key, w.id)} className="accent-white" />
                      <span className="text-sm text-gray-300">{w.name}</span>
                      <span className="text-xs text-gray-600">{w.tier}</span>
                    </label>
                  ))}
                  {workouts.length === 0 && <p className="text-xs text-gray-600">No workouts created yet.</p>}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-white text-black font-bold px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save program"}
          </button>
          <Link href="/coach/programs" className="border border-gray-700 text-gray-400 px-4 py-2 rounded text-sm hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
