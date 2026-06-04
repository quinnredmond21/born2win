import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Challenge, ChallengeSubmission, Profile } from "@/lib/types";
import ChallengeSubmitForm from "./ChallengeSubmitForm";

type SubmissionWithProfile = ChallengeSubmission & {
  profiles: { name: string } | null;
};

export default async function ChallengesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileResult, openChallengeResult, pastChallengesResult] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user!.id).single(),
    supabase
      .from("challenges")
      .select("*")
      .eq("status", "open")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("challenges")
      .select("id, name, metric_label, ends_at")
      .eq("status", "closed")
      .order("ends_at", { ascending: false })
      .limit(5),
  ]);

  const profile = profileResult.data as Pick<Profile, "tier"> | null;
  const activeChallenge = openChallengeResult.data as Challenge | null;
  const pastChallenges = pastChallengesResult.data ?? [];
  const isPaid = profile?.tier === "paid";

  let leaderboard: SubmissionWithProfile[] = [];
  let mySubmission: ChallengeSubmission | null = null;

  if (activeChallenge) {
    const [leaderboardResult, myResult] = await Promise.all([
      supabase
        .from("challenge_submissions")
        .select("id, user_id, score, submitted_at, profiles(name)")
        .eq("challenge_id", activeChallenge.id)
        .order("score", { ascending: activeChallenge.metric_direction === "asc" })
        .limit(25),
      supabase
        .from("challenge_submissions")
        .select("*")
        .eq("challenge_id", activeChallenge.id)
        .eq("user_id", user!.id)
        .maybeSingle(),
    ]);

    leaderboard = (leaderboardResult.data ?? []) as unknown as SubmissionWithProfile[];
    mySubmission = myResult.data as ChallengeSubmission | null;
  }

  return (
    <div className="space-y-12 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Challenges</h1>
        <p className="text-gray-400 text-sm">One challenge per month. One leaderboard. Compete or watch.</p>
      </div>

      {activeChallenge ? (
        <section className="space-y-6">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
              Active — closes {new Date(activeChallenge.ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>
            <h2 className="text-xl font-bold text-white">{activeChallenge.name}</h2>
            <p className="text-gray-400 mt-2">{activeChallenge.description}</p>
          </div>

          <div className="border border-gray-800 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-bold text-white">How to do it</h3>
            <p className="text-gray-400 text-sm">{activeChallenge.instructions}</p>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">How to record your score</p>
              <p className="text-gray-400 text-sm">{activeChallenge.how_to_record}</p>
            </div>
            <p className="text-xs text-gray-500">
              Metric: {activeChallenge.metric_label} ({activeChallenge.metric_direction === "asc" ? "lower is better" : "higher is better"})
            </p>
          </div>

          {isPaid ? (
            <ChallengeSubmitForm
              challengeId={activeChallenge.id}
              metricLabel={activeChallenge.metric_label}
              existingScore={mySubmission?.score ?? null}
            />
          ) : (
            <div className="border border-gray-700 rounded-lg p-4 space-y-2">
              <p className="text-white font-bold text-sm">Paid membership required to submit</p>
              <p className="text-gray-500 text-sm">
                You can view the leaderboard and attempt the workout. To post your score, upgrade your account.
              </p>
              <Link href="/profile" className="inline-block mt-1 text-sm text-white underline">
                View membership options
              </Link>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Leaderboard</h3>
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-sm">No submissions yet. Be the first.</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry, i) => {
                  const isMe = entry.user_id === user!.id;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                        isMe ? "border-white bg-gray-900" : "border-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 text-sm w-5 text-right">{i + 1}</span>
                        <span className="text-white text-sm font-medium">
                          {entry.profiles?.name ?? "Athlete"}
                          {isMe && <span className="text-gray-500 ml-2 text-xs">(you)</span>}
                        </span>
                      </div>
                      <span className="text-white font-bold text-sm">{entry.score}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="border border-gray-800 rounded-lg p-6">
          <p className="text-gray-400">No active challenge right now. Check back soon.</p>
        </div>
      )}

      {pastChallenges.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3">Past Challenges</h2>
          <div className="space-y-2">
            {pastChallenges.map((c) => (
              <Link
                key={c.id}
                href={`/challenges/${c.id}`}
                className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3 hover:border-gray-600 transition-colors"
              >
                <span className="text-white text-sm">{c.name}</span>
                <span className="text-gray-500 text-xs">
                  {new Date(c.ends_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
