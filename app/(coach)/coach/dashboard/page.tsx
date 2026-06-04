import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CoachDashboardPage() {
  const supabase = await createClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    totalAthletesResult,
    newAthletesResult,
    paidAthletesResult,
    workoutsResult,
    programsResult,
    openChallengeResult,
    recentLogsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_coach", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_coach", false).gte("created_at", sevenDaysAgo),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("tier", "paid").eq("is_coach", false),
    supabase.from("workouts").select("id", { count: "exact", head: true }),
    supabase.from("programs").select("id", { count: "exact", head: true }),
    supabase.from("challenges").select("id, name, ends_at").eq("status", "open").limit(1).maybeSingle(),
    supabase.from("workout_logs").select("id", { count: "exact", head: true }).gte("completed_at", sevenDaysAgo),
  ]);

  const totalAthletes = totalAthletesResult.count ?? 0;
  const newAthletes = newAthletesResult.count ?? 0;
  const paidAthletes = paidAthletesResult.count ?? 0;
  const totalWorkouts = workoutsResult.count ?? 0;
  const totalPrograms = programsResult.count ?? 0;
  const openChallenge = openChallengeResult.data;
  const weeklyLogs = recentLogsResult.count ?? 0;
  const conversionRate = totalAthletes > 0 ? Math.round((paidAthletes / totalAthletes) * 100) : 0;

  const stats = [
    { label: "Total Athletes", value: totalAthletes },
    { label: "New This Week", value: newAthletes },
    { label: "Paid Members", value: paidAthletes },
    { label: "Conversion Rate", value: `${conversionRate}%` },
    { label: "Workouts Logged This Week", value: weeklyLogs },
    { label: "Total Workouts", value: totalWorkouts },
    { label: "Total Programs", value: totalPrograms },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm">Born 2 Win — Coach View</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {openChallenge && (
        <div className="border border-gray-700 rounded-lg p-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Active Challenge</p>
          <p className="text-white font-bold">{openChallenge.name}</p>
          <p className="text-gray-500 text-xs mt-1">
            Closes {new Date(openChallenge.ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
          <Link href={`/coach/challenges/${openChallenge.id}`} className="inline-block mt-3 text-sm text-white underline">
            View submissions
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/coach/workouts/new", label: "New Workout" },
          { href: "/coach/programs/new", label: "New Program" },
          { href: "/coach/challenges/new", label: "New Challenge" },
          { href: "/coach/athletes", label: "View Athletes" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="border border-gray-700 rounded-lg px-4 py-3 text-sm font-medium text-white hover:border-gray-500 transition-colors text-center"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
