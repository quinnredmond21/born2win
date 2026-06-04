import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Program, Challenge, WorkoutLog } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileResult, programsResult, challengeResult, logsResult] = await Promise.all([
    supabase.from("profiles").select("name, tier").eq("id", user!.id).single(),
    supabase.from("programs").select("id, name, description, tier").order("created_at", { ascending: false }).limit(3),
    supabase
      .from("challenges")
      .select("id, name, description, metric_label, status, ends_at")
      .eq("status", "open")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("workout_logs")
      .select("completed_at")
      .eq("user_id", user!.id)
      .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const profile = profileResult.data;

  const programs = (programsResult.data ?? []) as Program[];
  const activeChallenge = challengeResult.data as Challenge | null;
  const recentLogs = (logsResult.data ?? []) as WorkoutLog[];
  const streak = recentLogs.length;
  const firstName = profile?.name?.split(" ")[0] ?? "Athlete";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black text-white">
          {firstName}.
        </h1>
        <p className="text-gray-400 mt-1">
          {streak > 0
            ? `${streak} workout${streak === 1 ? "" : "s"} logged this week.`
            : "No workouts logged this week. Let's change that."}
        </p>
      </div>

      {activeChallenge && (
        <div className="border border-gray-700 rounded-lg p-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Active Challenge</p>
          <h2 className="text-lg font-bold text-white mb-1">{activeChallenge.name}</h2>
          <p className="text-gray-400 text-sm mb-3">{activeChallenge.description}</p>
          <Link href="/challenges" className="text-sm font-bold text-white underline">
            View challenge and leaderboard
          </Link>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Programs</h2>
          <Link href="/programs" className="text-sm text-gray-400 hover:text-white">
            View all
          </Link>
        </div>

        {programs.length === 0 ? (
          <p className="text-gray-500 text-sm">No programs yet. Check back soon.</p>
        ) : (
          <div className="space-y-3">
            {programs.map((program) => {
              const isLocked = program.tier === "paid" && profile?.tier === "free";
              return (
                <Link
                  key={program.id}
                  href={isLocked ? "/profile" : `/programs/${program.id}`}
                  className="block border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white text-sm">{program.name}</h3>
                      {program.description && (
                        <p className="text-gray-500 text-xs mt-1">{program.description}</p>
                      )}
                    </div>
                    {isLocked && (
                      <span className="text-xs text-gray-500 border border-gray-700 rounded px-2 py-0.5 ml-3 shrink-0">
                        Paid
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
