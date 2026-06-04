import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Program, Workout } from "@/lib/types";

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("id", id)
    .single();

  if (!program) notFound();

  const p = program as Program;

  const workoutIds = Array.from(new Set(Object.values(p.schedule).flat()));

  let workouts: Workout[] = [];
  if (workoutIds.length > 0) {
    const { data } = await supabase
      .from("workouts")
      .select("id, name, description, exercises, tier")
      .in("id", workoutIds);
    workouts = (data ?? []) as Workout[];
  }

  const workoutMap = Object.fromEntries(workouts.map((w) => [w.id, w]));
  const scheduleEntries = Object.entries(p.schedule).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <Link href="/programs" className="text-gray-500 text-sm hover:text-white">
          Back to programs
        </Link>
        <h1 className="text-2xl font-black text-white mt-3">{p.name}</h1>
        {p.description && <p className="text-gray-400 mt-1">{p.description}</p>}
      </div>

      {scheduleEntries.length === 0 ? (
        <p className="text-gray-500">Schedule coming soon.</p>
      ) : (
        <div className="space-y-6">
          {scheduleEntries.map(([day, ids]) => (
            <div key={day}>
              <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                {day.replace(/_/g, " ")}
              </h2>
              <div className="space-y-2">
                {(ids as string[]).map((wid) => {
                  const w = workoutMap[wid];
                  if (!w) return null;
                  return (
                    <Link
                      key={wid}
                      href={`/workouts/${wid}`}
                      className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-600 transition-colors"
                    >
                      <span className="font-medium text-white text-sm">{w.name}</span>
                      <span className="text-gray-500 text-xs">
                        {(w.exercises as unknown[]).length} exercise{(w.exercises as unknown[]).length === 1 ? "" : "s"}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
