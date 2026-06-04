"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Exercise } from "@/lib/types";

const EMPTY_EXERCISE: Exercise = {
  name: "",
  sets: 3,
  reps: "10",
  rest: "60s",
  video_url: "",
  coaching_note: "",
};

export default function NewWorkoutPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"free" | "paid">("paid");
  const [exercises, setExercises] = useState<Exercise[]>([{ ...EMPTY_EXERCISE }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addExercise() {
    setExercises([...exercises, { ...EMPTY_EXERCISE }]);
  }

  function removeExercise(i: number) {
    setExercises(exercises.filter((_, idx) => idx !== i));
  }

  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises(exercises.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/coach/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, tier, exercises }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
      return;
    }

    router.push("/coach/workouts");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/coach/workouts" className="text-gray-500 text-sm hover:text-white">
          Back to workouts
        </Link>
        <h1 className="text-2xl font-black text-white mt-3">New Workout</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Workout name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Speed & Power Day A" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
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
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Exercises</h2>
            <button type="button" onClick={addExercise} className="text-sm text-gray-400 hover:text-white">
              + Add exercise
            </button>
          </div>

          {exercises.map((ex, i) => (
            <div key={i} className="border border-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Exercise {i + 1}</span>
                {exercises.length > 1 && (
                  <button type="button" onClick={() => removeExercise(i)} className="text-xs text-gray-600 hover:text-red-400">
                    Remove
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input type="text" value={ex.name} onChange={(e) => updateExercise(i, "name", e.target.value)} required placeholder="e.g. Bear crawl sprint" className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sets</label>
                  <input type="number" value={ex.sets} onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value))} min={1} className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reps</label>
                  <input type="text" value={ex.reps} onChange={(e) => updateExercise(i, "reps", e.target.value)} placeholder="10 or 10-12" className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rest</label>
                  <input type="text" value={ex.rest} onChange={(e) => updateExercise(i, "rest", e.target.value)} placeholder="60s" className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Video URL (optional)</label>
                <input type="url" value={ex.video_url ?? ""} onChange={(e) => updateExercise(i, "video_url", e.target.value)} placeholder="https://youtube.com/..." className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mighty Q coaching note (optional)</label>
                <input type="text" value={ex.coaching_note ?? ""} onChange={(e) => updateExercise(i, "coaching_note", e.target.value)} placeholder="What to focus on" className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-white text-black font-bold px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save workout"}
          </button>
          <Link href="/coach/workouts" className="border border-gray-700 text-gray-400 px-4 py-2 rounded text-sm hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
