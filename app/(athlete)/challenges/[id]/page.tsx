import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Challenge, ChallengeSubmission } from "@/lib/types";

type SubmissionWithProfile = ChallengeSubmission & {
  profiles: { name: string } | null;
};

export default async function PastChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*")
    .eq("id", id)
    .single();

  if (!challenge) notFound();

  const c = challenge as Challenge;

  const { data: submissions } = await supabase
    .from("challenge_submissions")
    .select("id, user_id, score, submitted_at, profiles(name)")
    .eq("challenge_id", id)
    .order("score", { ascending: c.metric_direction === "asc" });

  const leaderboard = (submissions ?? []) as unknown as SubmissionWithProfile[];

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/challenges" className="text-gray-500 text-sm hover:text-white">
          Back to challenges
        </Link>
        <p className="text-xs text-gray-500 uppercase tracking-widest mt-3 mb-1">Closed</p>
        <h1 className="text-2xl font-bold text-white">{c.name}</h1>
        <p className="text-gray-400 mt-1 text-sm">{c.description}</p>
        <p className="text-gray-600 text-xs mt-2">
          {new Date(c.starts_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })} —{" "}
          {new Date(c.ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Final Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-sm">No submissions were recorded for this challenge.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-4 py-3 rounded-lg border border-gray-800 ${i === 0 ? "border-gray-600" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm w-5 text-right">{i + 1}</span>
                  <span className={`text-sm font-medium ${i === 0 ? "text-white" : "text-gray-300"}`}>
                    {entry.profiles?.name ?? "Athlete"}
                  </span>
                </div>
                <span className={`font-bold text-sm ${i === 0 ? "text-white" : "text-gray-300"}`}>
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
