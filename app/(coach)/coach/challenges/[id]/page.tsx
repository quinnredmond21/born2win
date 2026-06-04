import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import CloseButton from "./CloseButton";
import type { Challenge, ChallengeSubmission } from "@/lib/types";

type SubmissionWithProfile = ChallengeSubmission & { profiles: { name: string } | null };

export default async function ChallengeDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
      <div className="flex items-start justify-between">
        <div>
          <Link href="/coach/challenges" className="text-gray-500 text-sm hover:text-white">
            Back to challenges
          </Link>
          <h1 className="text-2xl font-bold text-white mt-3">{c.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{c.description}</p>
          <p className="text-gray-600 text-xs mt-2">
            {new Date(c.starts_at).toLocaleDateString()} — {new Date(c.ends_at).toLocaleDateString()} — {c.status}
          </p>
        </div>
        {c.status === "open" && <CloseButton challengeId={c.id} />}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Submissions ({leaderboard.length})
          </h2>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-gray-500 text-sm">No submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-sm w-5 text-right">{i + 1}</span>
                  <div>
                    <p className="text-white text-sm">{entry.profiles?.name ?? "Athlete"}</p>
                    <p className="text-gray-600 text-xs">
                      {new Date(entry.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className="text-white font-bold">
                  {entry.score}{" "}
                  <span className="text-gray-500 text-xs font-normal">{c.metric_label}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
