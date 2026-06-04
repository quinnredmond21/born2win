import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Workout } from "@/lib/types";

export default async function CoachWorkoutsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("id, name, description, tier, exercises, created_at")
    .order("created_at", { ascending: false });

  const workouts = (data ?? []) as Workout[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Workouts</h1>
        <Link
          href="/coach/workouts/new"
          className="bg-white text-black font-bold px-4 py-2 rounded text-sm"
        >
          New workout
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-gray-500 text-sm">No workouts yet. Create the first one.</p>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <div key={w.id} className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3">
              <div>
                <p className="text-white font-medium">{w.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {(w.exercises as unknown[]).length} exercises — {w.tier}
                </p>
              </div>
              <Link
                href={`/coach/workouts/${w.id}/edit`}
                className="text-gray-400 hover:text-white text-sm"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
