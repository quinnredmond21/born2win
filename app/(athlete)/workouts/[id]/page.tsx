"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Workout, Exercise } from "@/lib/types";

export default function WorkoutPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [logging, setLogging] = useState(false);
  const [workoutId, setWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setWorkoutId(id);
      const supabase = createClient();
      supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          if (data) setWorkout(data as Workout);
        });
    });
  }, [params]);

  async function handleComplete() {
    if (!workoutId) return;
    setLogging(true);
    await fetch(`/api/workouts/${workoutId}/complete`, { method: "POST" });
    setDone(true);
    setLogging(false);
  }

  if (!workout) {
    return <div className="text-gray-500 text-sm">Loading workout...</div>;
  }

  const exercises = workout.exercises as Exercise[];
  const current = exercises[step];
  const isLast = step === exercises.length - 1;

  if (done) {
    return (
      <div className="max-w-sm space-y-6">
        <h1 className="text-2xl font-black text-white">Workout complete.</h1>
        <p className="text-gray-400">Logged to your progress.</p>
        <button
          onClick={() => router.push("/home")}
          className="bg-white text-black font-bold px-6 py-2 rounded"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-8">
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          {workout.name}
        </p>
        <p className="text-gray-400 text-sm">
          Exercise {step + 1} of {exercises.length}
        </p>
        <div className="mt-3 h-1 bg-gray-800 rounded-full">
          <div
            className="h-1 bg-white rounded-full transition-all"
            style={{ width: `${((step + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-2xl font-black text-white">{current.name}</h1>

        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Sets</p>
            <p className="text-white font-bold text-lg">{current.sets}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Reps</p>
            <p className="text-white font-bold text-lg">{current.reps}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Rest</p>
            <p className="text-white font-bold text-lg">{current.rest}</p>
          </div>
        </div>

        {current.coaching_note && (
          <div className="border-l-2 border-gray-700 pl-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mighty Q says</p>
            <p className="text-gray-300 text-sm">{current.coaching_note}</p>
          </div>
        )}

        {current.video_url && (
          <a
            href={current.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-white underline"
          >
            Watch demo
          </a>
        )}
      </div>

      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="border border-gray-700 text-white px-4 py-2 rounded font-medium text-sm"
          >
            Back
          </button>
        )}

        {!isLast ? (
          <button
            onClick={() => setStep(step + 1)}
            className="bg-white text-black font-bold px-6 py-2 rounded flex-1"
          >
            Next exercise
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={logging}
            className="bg-white text-black font-bold px-6 py-2 rounded flex-1 disabled:opacity-50"
          >
            {logging ? "Logging..." : "Complete workout"}
          </button>
        )}
      </div>
    </div>
  );
}
