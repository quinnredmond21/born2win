import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Challenge } from "@/lib/types";

export default async function CoachChallengesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("challenges")
    .select("id, name, metric_label, status, starts_at, ends_at")
    .order("starts_at", { ascending: false });

  const challenges = (data ?? []) as Challenge[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Challenges</h1>
        <Link href="/coach/challenges/new" className="bg-white text-black font-bold px-4 py-2 rounded text-sm">
          New challenge
        </Link>
      </div>

      {challenges.length === 0 ? (
        <p className="text-gray-500 text-sm">No challenges yet.</p>
      ) : (
        <div className="space-y-3">
          {challenges.map((c) => (
            <Link
              key={c.id}
              href={`/coach/challenges/${c.id}`}
              className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-600 transition-colors"
            >
              <div>
                <p className="text-white font-medium">{c.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {c.metric_label} —{" "}
                  {new Date(c.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded border ${
                  c.status === "open" ? "border-green-800 text-green-400" : "border-gray-700 text-gray-500"
                }`}
              >
                {c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
