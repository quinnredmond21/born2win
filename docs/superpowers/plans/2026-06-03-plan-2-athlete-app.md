# Born 2 Win — Plan 2: Athlete App

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full athlete-facing app: home page with real data, programs browser, workout player, progress tracking with baseline entry, and profile page.

**Architecture:** All pages are server components where possible (Supabase server client). Client components used only for interactivity (forms, workout step-through). API routes handle mutations (log workout completion, save baseline). No emojis anywhere.

**Tech Stack:** Next.js 16.2.7 App Router, Supabase SSR, Tailwind CSS 4, recharts for progress charts

---

## File Structure

```
app/
  (athlete)/
    home/page.tsx                  # Real home: greeting, today's workout, challenge callout
    programs/
      page.tsx                     # Browse all programs
      [id]/page.tsx                # Program detail: schedule view, start button
    workouts/
      [id]/page.tsx                # Workout player (client component)
    progress/
      page.tsx                     # Baseline entry form + charts per metric
    profile/
      page.tsx                     # Profile info, subscription status, sign out
app/
  api/
    workouts/[id]/complete/route.ts   # POST: log workout completion
    baselines/route.ts               # POST: save baseline entry
lib/
  types.ts                           # Shared TypeScript types
```

---

### Task 1: Shared types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write the types file**

Create `lib/types.ts`:

```typescript
export type Profile = {
  id: string;
  name: string;
  sport: string | null;
  position: string | null;
  tier: "free" | "paid";
  is_coach: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
};

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  video_url?: string;
  coaching_note?: string;
};

export type Workout = {
  id: string;
  name: string;
  description: string | null;
  exercises: Exercise[];
  tier: "free" | "paid";
  created_by: string | null;
  created_at: string;
};

export type Program = {
  id: string;
  name: string;
  description: string | null;
  schedule: Record<string, string[]>; // { "week1_day1": [workout_id, ...] }
  tier: "free" | "paid";
  created_by: string | null;
  created_at: string;
};

export type Challenge = {
  id: string;
  name: string;
  description: string;
  metric: string;
  metric_label: string;
  metric_direction: "asc" | "desc";
  instructions: string;
  how_to_record: string;
  status: "open" | "closed";
  starts_at: string;
  ends_at: string;
  created_by: string | null;
  created_at: string;
};

export type ChallengeSubmission = {
  id: string;
  challenge_id: string;
  user_id: string;
  score: number;
  submitted_at: string;
};

export type BaselineEntry = {
  id: string;
  user_id: string;
  metric: string;
  value: number;
  unit: string;
  logged_at: string;
};

export type WorkoutLog = {
  id: string;
  user_id: string;
  workout_id: string;
  completed_at: string;
};

export const BASELINE_METRICS: { key: string; label: string; unit: string; description: string }[] = [
  { key: "forty_yard", label: "40-Yard Dash", unit: "seconds", description: "Time yourself running 40 yards from a 3-point stance. Lower is better." },
  { key: "pro_agility", label: "Pro Agility (5-10-5)", unit: "seconds", description: "Set up 3 cones 5 yards apart. Sprint right 5 yards, left 10 yards, right 5 yards. Lower is better." },
  { key: "vertical_jump", label: "Vertical Jump", unit: "inches", description: "Stand next to a wall, reach as high as possible, then jump and touch the wall. Measure the difference. Higher is better." },
  { key: "broad_jump", label: "Broad Jump", unit: "inches", description: "Jump forward from a standing position as far as possible. Measure from starting line to heel. Higher is better." },
  { key: "shuttle_300", label: "300-Yard Shuttle", unit: "seconds", description: "Sprint 25 yards and back, 6 times without stopping. Lower is better." },
  { key: "mile_run", label: "Mile Run", unit: "seconds", description: "Run one mile as fast as possible. Lower is better." },
  { key: "pushups_60", label: "Max Pushups (60 sec)", unit: "reps", description: "Do as many full pushups as possible in 60 seconds. Higher is better." },
  { key: "situps_60", label: "Max Situps (60 sec)", unit: "reps", description: "Do as many full situps as possible in 60 seconds. Higher is better." },
  { key: "squat_pr", label: "Squat PR", unit: "lbs", description: "Your heaviest successful squat. Higher is better." },
  { key: "power_clean_pr", label: "Power Clean PR", unit: "lbs", description: "Your heaviest successful power clean. Higher is better." },
  { key: "bench_pr", label: "Bench Press PR", unit: "lbs", description: "Your heaviest successful bench press. Higher is better." },
  { key: "weight_current", label: "Current Weight", unit: "lbs", description: "Your body weight today." },
  { key: "weight_target", label: "Target Weight", unit: "lbs", description: "Your goal body weight." },
];
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 2: API routes for mutations

**Files:**
- Create: `app/api/workouts/[id]/complete/route.ts`
- Create: `app/api/baselines/route.ts`

- [ ] **Step 1: Create workout completion API route**

Create `app/api/workouts/[id]/complete/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: workoutId } = await params;

  const { error } = await supabase
    .from("workout_logs")
    .insert({ user_id: user.id, workout_id: workoutId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 2: Create baseline entry API route**

Create `app/api/baselines/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BASELINE_METRICS } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { metric, value } = body;

  const metricDef = BASELINE_METRICS.find((m) => m.key === metric);
  if (!metricDef) {
    return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
  }

  const numericValue = parseFloat(value);
  if (isNaN(numericValue) || numericValue <= 0) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  const { error } = await supabase
    .from("baseline_entries")
    .insert({ user_id: user.id, metric, value: numericValue, unit: metricDef.unit });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/workouts/ app/api/baselines/
git commit -m "feat: add workout completion and baseline entry API routes"
```

---

### Task 3: Athlete home page

**Files:**
- Modify: `app/(athlete)/home/page.tsx`

The home page shows: personalized greeting, the most recent program (if any exist), the active monthly challenge callout, and the athlete's workout streak (count of workout_logs in last 7 days).

- [ ] **Step 1: Replace the home stub with real content**

Replace `app/(athlete)/home/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Program, Challenge, WorkoutLog } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileResult, programsResult, challengeResult, logsResult] = await Promise.all([
    supabase.from("profiles").select("name, tier").eq("id", user!.id).single(),
    supabase.from("programs").select("id, name, description, tier").order("created_at", { ascending: false }).limit(3),
    supabase.from("challenges").select("id, name, description, metric_label, status, ends_at").eq("status", "open").limit(1).maybeSingle(),
    supabase.from("workout_logs").select("completed_at").eq("user_id", user!.id).gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const profile = profileResult.data;
  const programs = (programsResult.data ?? []) as Program[];
  const activeChallenge = challengeResult.data as Challenge | null;
  const recentLogs = (logsResult.data ?? []) as WorkoutLog[];
  const streak = recentLogs.length;
  const firstName = profile?.name?.split(" ")[0] ?? "Athlete";

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl font-black text-white">
          {firstName}.
        </h1>
        <p className="text-gray-400 mt-1">
          {streak > 0 ? `${streak} workout${streak === 1 ? "" : "s"} logged this week.` : "No workouts logged this week. Let's change that."}
        </p>
      </div>

      {/* Active challenge callout */}
      {activeChallenge && (
        <div className="border border-gray-700 rounded-lg p-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Active Challenge</p>
          <h2 className="text-lg font-bold text-white mb-1">{activeChallenge.name}</h2>
          <p className="text-gray-400 text-sm mb-3">{activeChallenge.description}</p>
          <Link
            href="/challenges"
            className="text-sm font-bold text-white underline"
          >
            View challenge and leaderboard
          </Link>
        </div>
      )}

      {/* Programs */}
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
```

- [ ] **Step 2: Verify dev server shows the page**

```bash
cd /Users/quinnredmond/born2win && npm run dev
```

Open http://localhost:3000/home — confirm it loads without errors, shows the greeting and sections. (Programs and challenge sections will be empty until data exists.)

- [ ] **Step 3: Commit**

```bash
git add app/\(athlete\)/home/page.tsx
git commit -m "feat: build athlete home page with real data"
```

---

### Task 4: Programs page

**Files:**
- Create: `app/(athlete)/programs/page.tsx`
- Create: `app/(athlete)/programs/[id]/page.tsx`

- [ ] **Step 1: Create programs list page**

Create `app/(athlete)/programs/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Program } from "@/lib/types";

export default async function ProgramsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileResult, programsResult] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user!.id).single(),
    supabase.from("programs").select("id, name, description, tier, created_at").order("created_at", { ascending: false }),
  ]);

  const tier = profileResult.data?.tier ?? "free";
  const programs = (programsResult.data ?? []) as Program[];

  const freePrograms = programs.filter((p) => p.tier === "free");
  const paidPrograms = programs.filter((p) => p.tier === "paid");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Programs</h1>
        <p className="text-gray-400 text-sm">Built by Mighty Q. Pick one and run it.</p>
      </div>

      {freePrograms.length > 0 && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Free</h2>
          <div className="space-y-3">
            {freePrograms.map((program) => (
              <Link
                key={program.id}
                href={`/programs/${program.id}`}
                className="block border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <h3 className="font-bold text-white">{program.name}</h3>
                {program.description && (
                  <p className="text-gray-500 text-sm mt-1">{program.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {paidPrograms.length > 0 && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Paid</h2>
          <div className="space-y-3">
            {paidPrograms.map((program) => {
              const locked = tier === "free";
              return (
                <Link
                  key={program.id}
                  href={locked ? "/profile" : `/programs/${program.id}`}
                  className="block border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white">{program.name}</h3>
                      {program.description && (
                        <p className="text-gray-500 text-sm mt-1">{program.description}</p>
                      )}
                    </div>
                    {locked && (
                      <span className="text-xs border border-gray-600 text-gray-400 rounded px-2 py-0.5 ml-3 shrink-0">
                        Paid only
                      </span>
                    )}
                  </div>
                  {locked && (
                    <p className="text-gray-600 text-xs mt-2">Upgrade to access this program.</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {programs.length === 0 && (
        <p className="text-gray-500">No programs available yet. Check back soon.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create program detail page**

Create `app/(athlete)/programs/[id]/page.tsx`:

```tsx
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

  // Collect all unique workout IDs from the schedule
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
```

- [ ] **Step 3: Commit**

```bash
git add "app/(athlete)/programs/"
git commit -m "feat: add programs list and detail pages"
```

---

### Task 5: Workout player

**Files:**
- Create: `app/(athlete)/workouts/[id]/page.tsx`

This is a client component that lets athletes step through exercises one at a time and log completion.

- [ ] **Step 1: Create workout player page**

Create `app/(athlete)/workouts/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Workout, Exercise } from "@/lib/types";

export default function WorkoutPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [logging, setLogging] = useState(false);
  const [workoutId, setWorkoutId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ id }) => {
      setWorkoutId(id);
      const supabase = createClient();
      supabase
        .from("workouts")
        .select("*")
        .eq("id", id)
        .single()
        .then(({ data }) => {
          if (data) setWorkout(data as Workout);
        });
    });
  }, [params]);

  async function handleComplete() {
    if (!workoutId) return;
    setLogging(true);
    await fetch(`/api/workouts/${workoutId}/complete`, { method: "POST" });
    setDone(true);
    setLogging(false);
  }

  if (!workout) {
    return (
      <div className="text-gray-500 text-sm">Loading workout...</div>
    );
  }

  const exercises = workout.exercises as Exercise[];
  const current = exercises[step];
  const isLast = step === exercises.length - 1;

  if (done) {
    return (
      <div className="max-w-sm space-y-6">
        <h1 className="text-2xl font-black text-white">Workout complete.</h1>
        <p className="text-gray-400">Logged to your progress.</p>
        <button
          onClick={() => router.push("/home")}
          className="bg-white text-black font-bold px-6 py-2 rounded"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-sm space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">
          {workout.name}
        </p>
        <p className="text-gray-400 text-sm">
          Exercise {step + 1} of {exercises.length}
        </p>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-800 rounded-full">
          <div
            className="h-1 bg-white rounded-full transition-all"
            style={{ width: `${((step + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current exercise */}
      <div className="space-y-4">
        <h1 className="text-2xl font-black text-white">{current.name}</h1>

        <div className="flex gap-6 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Sets</p>
            <p className="text-white font-bold text-lg">{current.sets}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Reps</p>
            <p className="text-white font-bold text-lg">{current.reps}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Rest</p>
            <p className="text-white font-bold text-lg">{current.rest}</p>
          </div>
        </div>

        {current.coaching_note && (
          <div className="border-l-2 border-gray-700 pl-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Mighty Q says</p>
            <p className="text-gray-300 text-sm">{current.coaching_note}</p>
          </div>
        )}

        {current.video_url && (
          <a
            href={current.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-sm text-white underline"
          >
            Watch demo
          </a>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="border border-gray-700 text-white px-4 py-2 rounded font-medium text-sm"
          >
            Back
          </button>
        )}

        {!isLast ? (
          <button
            onClick={() => setStep(step + 1)}
            className="bg-white text-black font-bold px-6 py-2 rounded flex-1"
          >
            Next exercise
          </button>
        ) : (
          <button
            onClick={handleComplete}
            disabled={logging}
            className="bg-white text-black font-bold px-6 py-2 rounded flex-1 disabled:opacity-50"
          >
            {logging ? "Logging..." : "Complete workout"}
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/(athlete)/workouts/"
git commit -m "feat: add workout player with step-through and completion logging"
```

---

### Task 6: Progress and baseline tracking

**Files:**
- Create: `app/(athlete)/progress/page.tsx`
- Install recharts

- [ ] **Step 1: Install recharts**

```bash
cd /Users/quinnredmond/born2win && npm install recharts
```

- [ ] **Step 2: Create progress page**

Create `app/(athlete)/progress/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BASELINE_METRICS, type BaselineEntry } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ProgressPage() {
  const [entries, setEntries] = useState<BaselineEntry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState(BASELINE_METRICS[0].key);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [workoutCount, setWorkoutCount] = useState(0);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [baselineResult, logsResult] = await Promise.all([
        supabase
          .from("baseline_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("logged_at", { ascending: true }),
        supabase
          .from("workout_logs")
          .select("id")
          .eq("user_id", user.id),
      ]);

      setEntries((baselineResult.data ?? []) as BaselineEntry[]);
      setWorkoutCount(logsResult.data?.length ?? 0);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess(false);
    setSaving(true);

    const res = await fetch("/api/baselines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metric: selectedMetric, value }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setSaveError(data.error ?? "Failed to save.");
      return;
    }

    setSaveSuccess(true);
    setValue("");

    // Reload entries
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("baseline_entries")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true });
      setEntries((data ?? []) as BaselineEntry[]);
    }
  }

  const metricDef = BASELINE_METRICS.find((m) => m.key === selectedMetric)!;
  const chartData = entries
    .filter((e) => e.metric === selectedMetric)
    .map((e) => ({
      date: new Date(e.logged_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: e.value,
    }));

  const latestByMetric = BASELINE_METRICS.map((m) => {
    const latest = entries.filter((e) => e.metric === m.key).at(-1);
    return { ...m, latest };
  }).filter((m) => m.latest);

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Progress</h1>
        <p className="text-gray-400 text-sm">
          {workoutCount} total workout{workoutCount === 1 ? "" : "s"} logged.
        </p>
      </div>

      {/* Log a baseline */}
      <section className="border border-gray-800 rounded-lg p-5 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">Log a Baseline</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Test</label>
            <select
              value={selectedMetric}
              onChange={(e) => { setSelectedMetric(e.target.value); setSaveSuccess(false); }}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            >
              {BASELINE_METRICS.map((m) => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-500 leading-relaxed">
            {metricDef.description}
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Your result ({metricDef.unit})
            </label>
            <input
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              placeholder={metricDef.unit === "seconds" ? "e.g. 4.52" : "e.g. 225"}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            />
          </div>

          {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
          {saveSuccess && <p className="text-green-400 text-xs">Saved.</p>}

          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black font-bold px-4 py-2 rounded text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Log result"}
          </button>
        </form>
      </section>

      {/* Chart */}
      {chartData.length >= 2 && (
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            {metricDef.label} over time
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                contentStyle={{ background: "#111", border: "1px solid #374151", color: "#fff", fontSize: 12 }}
                labelStyle={{ color: "#9ca3af" }}
              />
              <Line type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} dot={{ fill: "#ffffff", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Current bests */}
      {latestByMetric.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Current Bests</h2>
          <div className="grid grid-cols-2 gap-3">
            {latestByMetric.map((m) => (
              <div key={m.key} className="border border-gray-800 rounded p-3">
                <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                <p className="text-white font-bold">{m.latest!.value} <span className="text-gray-500 font-normal text-xs">{m.unit}</span></p>
              </div>
            ))}
          </div>
        </section>
      )}

      {entries.length === 0 && (
        <p className="text-gray-500 text-sm">No baselines logged yet. Use the form above to record your first result.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(athlete)/progress/"
git commit -m "feat: add progress page with baseline entry form and charts"
```

---

### Task 7: Profile page

**Files:**
- Create: `app/(athlete)/profile/page.tsx`

- [ ] **Step 1: Create profile page**

Create `app/(athlete)/profile/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, sport, position, tier, created_at")
    .eq("id", user.id)
    .single();

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-sm space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">{profile?.name ?? "Athlete"}</h1>
        <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        {joinDate && <p className="text-gray-600 text-xs mt-1">Member since {joinDate}</p>}
      </div>

      <div className="space-y-3">
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sport</p>
          <p className="text-white">{profile?.sport ?? "Not set"}</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Position</p>
          <p className="text-white">{profile?.position || "Not set"}</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Membership</p>
          <p className="text-white capitalize">{profile?.tier ?? "free"}</p>
          {profile?.tier === "free" && (
            <p className="text-gray-500 text-xs mt-1">
              Upgrade to access paid programs and compete in monthly challenges.
            </p>
          )}
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
```

- [ ] **Step 2: Create SignOutButton client component**

Create `app/(athlete)/profile/SignOutButton.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      className="border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 px-4 py-2 rounded text-sm transition-colors"
    >
      Sign out
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add "app/(athlete)/profile/"
git commit -m "feat: add athlete profile page with sign out"
```

---

### Task 8: Deploy and verify

- [ ] **Step 1: Push to GitHub**

```bash
cd /Users/quinnredmond/born2win && git push origin main
```

- [ ] **Step 2: Verify Vercel deployment**

Wait for Vercel to deploy (auto-triggers on push). Visit https://born2win.vercel.app and confirm:
- Home page loads
- Programs page loads
- Progress page loads
- Profile page loads with sign out
- No build errors in Vercel dashboard

- [ ] **Step 3: Install recharts on Vercel**

recharts was added to package.json via `npm install` — it should deploy automatically. If the build fails, check the Vercel build logs for the error.

- [ ] **Step 4: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: resolve any build issues for Plan 2 deployment"
git push origin main
```
