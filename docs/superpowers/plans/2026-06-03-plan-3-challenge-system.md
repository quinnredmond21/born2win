# Born 2 Win — Plan 3: Challenge System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full monthly challenge system — athlete challenges page with live leaderboard, score submission with paid-tier gate, and past challenge archive. No emojis anywhere.

**Architecture:** Challenges page is a server component that fetches challenge and leaderboard data. Score submission goes through an API route that enforces the paid-tier check server-side. Free users see the leaderboard but hit a paywall when trying to submit.

**Tech Stack:** Next.js 16.2.7 App Router, Supabase SSR

---

## File Structure

```
app/
  (athlete)/
    challenges/
      page.tsx               # Active challenge + leaderboard + submit form (paid gate)
      [id]/page.tsx          # Past challenge detail + final leaderboard
app/
  api/
    challenges/[id]/submit/route.ts  # POST: submit score (enforces paid tier)
```

---

### Task 1: Challenge submission API route

**Files:**
- Create: `app/api/challenges/[id]/submit/route.ts`

- [ ] **Step 1: Create the submission route**

Create `app/api/challenges/[id]/submit/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Enforce paid tier server-side
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (profile?.tier !== "paid") {
    return NextResponse.json({ error: "Paid membership required to submit scores." }, { status: 403 });
  }

  const { id: challengeId } = await params;

  // Verify challenge exists and is open
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, status")
    .eq("id", challengeId)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found." }, { status: 404 });
  }

  if (challenge.status !== "open") {
    return NextResponse.json({ error: "This challenge is closed." }, { status: 400 });
  }

  const body = await request.json();
  const score = parseFloat(body.score);

  if (isNaN(score) || score <= 0) {
    return NextResponse.json({ error: "Invalid score." }, { status: 400 });
  }

  // Upsert — one submission per athlete per challenge
  const { error } = await supabase
    .from("challenge_submissions")
    .upsert(
      { challenge_id: challengeId, user_id: user.id, score, submitted_at: new Date().toISOString() },
      { onConflict: "challenge_id,user_id" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/challenges/
git commit -m "feat: add challenge score submission API route with paid-tier enforcement"
```

---

### Task 2: Challenges page (athlete view)

**Files:**
- Create: `app/(athlete)/challenges/page.tsx`

This page shows the active challenge, the leaderboard, and a submission form. Free users see everything but the submit button is replaced with an upgrade prompt.

- [ ] **Step 1: Create challenges page**

Create `app/(athlete)/challenges/page.tsx`:

```tsx
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

  // Fetch leaderboard for active challenge
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

    leaderboard = (leaderboardResult.data ?? []) as SubmissionWithProfile[];
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
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Active — closes {new Date(activeChallenge.ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
            <h2 className="text-xl font-bold text-white">{activeChallenge.name}</h2>
            <p className="text-gray-400 mt-2">{activeChallenge.description}</p>
          </div>

          {/* Instructions */}
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

          {/* Submit form */}
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

          {/* Leaderboard */}
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

      {/* Past challenges */}
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
```

- [ ] **Step 2: Create ChallengeSubmitForm client component**

Create `app/(athlete)/challenges/ChallengeSubmitForm.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  challengeId: string;
  metricLabel: string;
  existingScore: number | null;
};

export default function ChallengeSubmitForm({ challengeId, metricLabel, existingScore }: Props) {
  const router = useRouter();
  const [score, setScore] = useState(existingScore?.toString() ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const res = await fetch(`/api/challenges/${challengeId}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to submit.");
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4 space-y-3">
      <h3 className="text-sm font-bold text-white">
        {existingScore !== null ? "Update your score" : "Submit your score"}
      </h3>
      {existingScore !== null && (
        <p className="text-gray-500 text-xs">Current submission: {existingScore}</p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">{metricLabel}</label>
          <input
            type="number"
            step="any"
            value={score}
            onChange={(e) => { setScore(e.target.value); setSuccess(false); }}
            required
            placeholder="Your result"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-white text-black font-bold px-4 py-2 rounded text-sm disabled:opacity-50 shrink-0"
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {error && <p className="text-red-400 text-xs">{error}</p>}
      {success && <p className="text-green-400 text-xs">Score submitted. Leaderboard updated.</p>}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(athlete)/challenges/"
git commit -m "feat: add challenges page with leaderboard and paid-tier submission gate"
```

---

### Task 3: Past challenge detail page

**Files:**
- Create: `app/(athlete)/challenges/[id]/page.tsx`

- [ ] **Step 1: Create past challenge detail page**

Create `app/(athlete)/challenges/[id]/page.tsx`:

```tsx
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

  const leaderboard = (submissions ?? []) as SubmissionWithProfile[];

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
          {new Date(c.starts_at).toLocaleDateString("en-US", { month: "long", day: "numeric" })} — {new Date(c.ends_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/(athlete)/challenges/[id]/"
git commit -m "feat: add past challenge detail page with final leaderboard"
```

---

### Task 4: Deploy and verify

- [ ] **Step 1: Push to GitHub**

```bash
cd /Users/quinnredmond/born2win && git push origin main
```

- [ ] **Step 2: Verify in Vercel**

Check build logs. Confirm challenges page deploys without errors.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix: resolve build issues for Plan 3" && git push origin main
```
