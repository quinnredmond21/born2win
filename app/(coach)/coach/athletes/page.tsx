import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function CoachAthletesPage() {
  const supabase = await createClient();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, sport, position, tier, created_at")
    .eq("is_coach", false)
    .order("created_at", { ascending: false });

  const athletes = (profiles ?? []) as Profile[];

  const { data: recentLogs } = await supabase
    .from("workout_logs")
    .select("user_id")
    .gte("completed_at", sevenDaysAgo);

  const logCountByUser: Record<string, number> = {};
  (recentLogs ?? []).forEach((log) => {
    logCountByUser[log.user_id] = (logCountByUser[log.user_id] ?? 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Athletes</h1>
        <p className="text-gray-400 text-sm">{athletes.length} total members</p>
      </div>

      {athletes.length === 0 ? (
        <p className="text-gray-500 text-sm">No athletes yet.</p>
      ) : (
        <div className="space-y-2">
          {athletes.map((a) => {
            const weeklyLogs = logCountByUser[a.id] ?? 0;
            return (
              <div key={a.id} className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3">
                <div>
                  <p className="text-white font-medium text-sm">{a.name || "Unnamed"}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {a.sport ?? "No sport"}
                    {a.position ? ` — ${a.position}` : ""} — joined{" "}
                    {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  {weeklyLogs > 0 && (
                    <span className="text-xs text-gray-400">
                      {weeklyLogs} workout{weeklyLogs === 1 ? "" : "s"} this week
                    </span>
                  )}
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      a.tier === "paid" ? "border-white text-white" : "border-gray-700 text-gray-500"
                    }`}
                  >
                    {a.tier}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
