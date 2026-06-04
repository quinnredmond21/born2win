# Born 2 Win — Plan 4: Coach Dashboard

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full coach dashboard for Mighty Q: workout builder, program builder, challenge manager, athlete roster, and analytics. No emojis anywhere.

**Architecture:** All coach pages live under `app/(coach)/coach/`. Server components load data; client components handle forms. All mutations go through API routes or direct Supabase client calls in client components. The middleware already blocks non-coaches from `/coach` routes.

**Tech Stack:** Next.js 16.2.7 App Router, Supabase SSR

---

## File Structure

```
app/
  (coach)/
    coach/
      dashboard/page.tsx          # Overview: counts, recent activity
      workouts/
        page.tsx                  # List all workouts
        new/page.tsx              # Create new workout
        [id]/edit/page.tsx        # Edit existing workout
      programs/
        page.tsx                  # List all programs
        new/page.tsx              # Create new program
        [id]/edit/page.tsx        # Edit existing program
      challenges/
        page.tsx                  # List challenges
        new/page.tsx              # Create new challenge
        [id]/page.tsx             # View challenge submissions, close it
      athletes/
        page.tsx                  # Athlete roster
app/
  api/
    coach/
      workouts/route.ts           # POST: create workout
      workouts/[id]/route.ts      # PATCH/DELETE: update or delete workout
      programs/route.ts           # POST: create program
      programs/[id]/route.ts      # PATCH/DELETE: update or delete program
      challenges/route.ts         # POST: create challenge
      challenges/[id]/close/route.ts  # POST: close challenge
```

---

### Task 1: Coach API routes

**Files:**
- Create: `app/api/coach/workouts/route.ts`
- Create: `app/api/coach/workouts/[id]/route.ts`
- Create: `app/api/coach/programs/route.ts`
- Create: `app/api/coach/programs/[id]/route.ts`
- Create: `app/api/coach/challenges/route.ts`
- Create: `app/api/coach/challenges/[id]/close/route.ts`

All coach API routes use a shared helper to verify the caller is a coach.

- [ ] **Step 1: Create coach auth helper**

Create `lib/coach-auth.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function requireCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_coach")
    .eq("id", user.id)
    .single();

  if (!profile?.is_coach) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), supabase: null, user: null };
  }

  return { error: null, supabase, user };
}
```

- [ ] **Step 2: Create workout API routes**

Create `app/api/coach/workouts/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";

export async function POST(request: NextRequest) {
  const { error, supabase, user } = await requireCoach();
  if (error) return error;

  const body = await request.json();
  const { name, description, exercises, tier } = body;

  if (!name || !Array.isArray(exercises)) {
    return NextResponse.json({ error: "Name and exercises required." }, { status: 400 });
  }

  const { data, error: dbError } = await supabase!
    .from("workouts")
    .insert({ name, description: description || null, exercises, tier: tier ?? "paid", created_by: user!.id })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}
```

Create `app/api/coach/workouts/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireCoach();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const { data, error: dbError } = await supabase!
    .from("workouts")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireCoach();
  if (error) return error;

  const { id } = await params;

  const { error: dbError } = await supabase!.from("workouts").delete().eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create program API routes**

Create `app/api/coach/programs/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";

export async function POST(request: NextRequest) {
  const { error, supabase, user } = await requireCoach();
  if (error) return error;

  const body = await request.json();
  const { name, description, schedule, tier } = body;

  if (!name) {
    return NextResponse.json({ error: "Name required." }, { status: 400 });
  }

  const { data, error: dbError } = await supabase!
    .from("programs")
    .insert({ name, description: description || null, schedule: schedule ?? {}, tier: tier ?? "paid", created_by: user!.id })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}
```

Create `app/api/coach/programs/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireCoach();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  const { data, error: dbError } = await supabase!
    .from("programs")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireCoach();
  if (error) return error;

  const { id } = await params;
  const { error: dbError } = await supabase!.from("programs").delete().eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Create challenge API routes**

Create `app/api/coach/challenges/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";

export async function POST(request: NextRequest) {
  const { error, supabase, user } = await requireCoach();
  if (error) return error;

  const body = await request.json();
  const { name, description, metric, metric_label, metric_direction, instructions, how_to_record, starts_at, ends_at } = body;

  if (!name || !metric || !metric_label || !instructions || !how_to_record || !starts_at || !ends_at) {
    return NextResponse.json({ error: "All fields required." }, { status: 400 });
  }

  const { data, error: dbError } = await supabase!
    .from("challenges")
    .insert({
      name,
      description: description || "",
      metric,
      metric_label,
      metric_direction: metric_direction ?? "desc",
      instructions,
      how_to_record,
      starts_at,
      ends_at,
      status: "open",
      created_by: user!.id,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json(data);
}
```

Create `app/api/coach/challenges/[id]/close/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireCoach } from "@/lib/coach-auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireCoach();
  if (error) return error;

  const { id } = await params;

  const { error: dbError } = await supabase!
    .from("challenges")
    .update({ status: "closed" })
    .eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 5: Commit**

```bash
git add lib/coach-auth.ts app/api/coach/
git commit -m "feat: add coach API routes for workouts, programs, and challenges"
```

---

### Task 2: Coach dashboard overview

**Files:**
- Modify: `app/(coach)/coach/dashboard/page.tsx`

- [ ] **Step 1: Replace the stub with real counts and recent signups**

Replace `app/(coach)/coach/dashboard/page.tsx`:

```tsx
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="border border-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-black text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Active challenge */}
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

      {/* Quick links */}
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/(coach)/coach/dashboard/page.tsx"
git commit -m "feat: build coach dashboard overview with real stats"
```

---

### Task 3: Workout builder

**Files:**
- Create: `app/(coach)/coach/workouts/page.tsx`
- Create: `app/(coach)/coach/workouts/new/page.tsx`
- Create: `app/(coach)/coach/workouts/[id]/edit/page.tsx`

- [ ] **Step 1: Create workouts list page**

Create `app/(coach)/coach/workouts/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Workout } from "@/lib/types";

export default async function CoachWorkoutsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("workouts")
    .select("id, name, description, tier, exercises, created_at")
    .order("created_at", { ascending: false });

  const workouts = (data ?? []) as Workout[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Workouts</h1>
        <Link
          href="/coach/workouts/new"
          className="bg-white text-black font-bold px-4 py-2 rounded text-sm"
        >
          New workout
        </Link>
      </div>

      {workouts.length === 0 ? (
        <p className="text-gray-500 text-sm">No workouts yet. Create the first one.</p>
      ) : (
        <div className="space-y-3">
          {workouts.map((w) => (
            <div key={w.id} className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3">
              <div>
                <p className="text-white font-medium">{w.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {(w.exercises as unknown[]).length} exercises — {w.tier}
                </p>
              </div>
              <Link
                href={`/coach/workouts/${w.id}/edit`}
                className="text-gray-400 hover:text-white text-sm"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create new workout page**

Create `app/(coach)/coach/workouts/new/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Exercise } from "@/lib/types";

const EMPTY_EXERCISE: Exercise = {
  name: "",
  sets: 3,
  reps: "10",
  rest: "60s",
  video_url: "",
  coaching_note: "",
};

export default function NewWorkoutPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"free" | "paid">("paid");
  const [exercises, setExercises] = useState<Exercise[]>([{ ...EMPTY_EXERCISE }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addExercise() {
    setExercises([...exercises, { ...EMPTY_EXERCISE }]);
  }

  function removeExercise(i: number) {
    setExercises(exercises.filter((_, idx) => idx !== i));
  }

  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises(exercises.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/coach/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, tier, exercises }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
      return;
    }

    router.push("/coach/workouts");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/coach/workouts" className="text-gray-500 text-sm hover:text-white">
          Back to workouts
        </Link>
        <h1 className="text-2xl font-black text-white mt-3">New Workout</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Workout name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Speed & Power Day A"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Access tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as "free" | "paid")}
              className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
            >
              <option value="paid">Paid only</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Exercises</h2>
            <button
              type="button"
              onClick={addExercise}
              className="text-sm text-gray-400 hover:text-white"
            >
              + Add exercise
            </button>
          </div>

          {exercises.map((ex, i) => (
            <div key={i} className="border border-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Exercise {i + 1}</span>
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(i)}
                    className="text-xs text-gray-600 hover:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={ex.name}
                  onChange={(e) => updateExercise(i, "name", e.target.value)}
                  required
                  placeholder="e.g. Bear crawl sprint"
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sets</label>
                  <input
                    type="number"
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value))}
                    min={1}
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reps</label>
                  <input
                    type="text"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, "reps", e.target.value)}
                    placeholder="10 or 10-12"
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rest</label>
                  <input
                    type="text"
                    value={ex.rest}
                    onChange={(e) => updateExercise(i, "rest", e.target.value)}
                    placeholder="60s"
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Video URL (optional)</label>
                <input
                  type="url"
                  value={ex.video_url ?? ""}
                  onChange={(e) => updateExercise(i, "video_url", e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Mighty Q coaching note (optional)</label>
                <input
                  type="text"
                  value={ex.coaching_note ?? ""}
                  onChange={(e) => updateExercise(i, "coaching_note", e.target.value)}
                  placeholder="What to focus on"
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white"
                />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black font-bold px-6 py-2 rounded text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save workout"}
          </button>
          <Link href="/coach/workouts" className="border border-gray-700 text-gray-400 px-4 py-2 rounded text-sm hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create edit workout page**

Create `app/(coach)/coach/workouts/[id]/edit/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Workout, Exercise } from "@/lib/types";

const EMPTY_EXERCISE: Exercise = {
  name: "",
  sets: 3,
  reps: "10",
  rest: "60s",
  video_url: "",
  coaching_note: "",
};

export default function EditWorkoutPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"free" | "paid">("paid");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setWorkoutId(id);
      const supabase = createClient();
      supabase.from("workouts").select("*").eq("id", id).single().then(({ data }) => {
        if (data) {
          const w = data as Workout;
          setName(w.name);
          setDescription(w.description ?? "");
          setTier(w.tier);
          setExercises(w.exercises as Exercise[]);
          setLoaded(true);
        }
      });
    });
  }, [params]);

  function addExercise() { setExercises([...exercises, { ...EMPTY_EXERCISE }]); }
  function removeExercise(i: number) { setExercises(exercises.filter((_, idx) => idx !== i)); }
  function updateExercise(i: number, field: keyof Exercise, value: string | number) {
    setExercises(exercises.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch(`/api/coach/workouts/${workoutId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, tier, exercises }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
      return;
    }

    router.push("/coach/workouts");
  }

  async function handleDelete() {
    if (!confirm("Delete this workout? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/coach/workouts/${workoutId}`, { method: "DELETE" });
    router.push("/coach/workouts");
  }

  if (!loaded) return <div className="text-gray-500 text-sm">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/coach/workouts" className="text-gray-500 text-sm hover:text-white">
            Back to workouts
          </Link>
          <h1 className="text-2xl font-black text-white mt-3">Edit Workout</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-500 hover:text-red-400 mt-6 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Workout name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Access tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as "free" | "paid")} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white">
              <option value="paid">Paid only</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Exercises</h2>
            <button type="button" onClick={addExercise} className="text-sm text-gray-400 hover:text-white">+ Add exercise</button>
          </div>

          {exercises.map((ex, i) => (
            <div key={i} className="border border-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Exercise {i + 1}</span>
                {exercises.length > 1 && (
                  <button type="button" onClick={() => removeExercise(i)} className="text-xs text-gray-600 hover:text-red-400">Remove</button>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input type="text" value={ex.name} onChange={(e) => updateExercise(i, "name", e.target.value)} required className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Sets</label>
                  <input type="number" value={ex.sets} onChange={(e) => updateExercise(i, "sets", parseInt(e.target.value))} min={1} className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Reps</label>
                  <input type="text" value={ex.reps} onChange={(e) => updateExercise(i, "reps", e.target.value)} className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Rest</label>
                  <input type="text" value={ex.rest} onChange={(e) => updateExercise(i, "rest", e.target.value)} className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Video URL (optional)</label>
                <input type="url" value={ex.video_url ?? ""} onChange={(e) => updateExercise(i, "video_url", e.target.value)} className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Coaching note (optional)</label>
                <input type="text" value={ex.coaching_note ?? ""} onChange={(e) => updateExercise(i, "coaching_note", e.target.value)} className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-white text-black font-bold px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
          <Link href="/coach/workouts" className="border border-gray-700 text-gray-400 px-4 py-2 rounded text-sm hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(coach)/coach/workouts/"
git commit -m "feat: add coach workout builder (list, create, edit)"
```

---

### Task 4: Program builder

**Files:**
- Create: `app/(coach)/coach/programs/page.tsx`
- Create: `app/(coach)/coach/programs/new/page.tsx`
- Create: `app/(coach)/coach/programs/[id]/edit/page.tsx`

- [ ] **Step 1: Create programs list page**

Create `app/(coach)/coach/programs/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Program } from "@/lib/types";

export default async function CoachProgramsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, description, tier, schedule, created_at")
    .order("created_at", { ascending: false });

  const programs = (data ?? []) as Program[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Programs</h1>
        <Link href="/coach/programs/new" className="bg-white text-black font-bold px-4 py-2 rounded text-sm">
          New program
        </Link>
      </div>

      {programs.length === 0 ? (
        <p className="text-gray-500 text-sm">No programs yet.</p>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <div key={p.id} className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3">
              <div>
                <p className="text-white font-medium">{p.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {Object.keys(p.schedule).length} days scheduled — {p.tier}
                </p>
              </div>
              <Link href={`/coach/programs/${p.id}/edit`} className="text-gray-400 hover:text-white text-sm">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create new program page**

Create `app/(coach)/coach/programs/new/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Workout } from "@/lib/types";

const DAYS = [
  "Week 1 - Monday", "Week 1 - Wednesday", "Week 1 - Friday",
  "Week 2 - Monday", "Week 2 - Wednesday", "Week 2 - Friday",
  "Week 3 - Monday", "Week 3 - Wednesday", "Week 3 - Friday",
  "Week 4 - Monday", "Week 4 - Wednesday", "Week 4 - Friday",
];

export default function NewProgramPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"free" | "paid">("paid");
  const [schedule, setSchedule] = useState<Record<string, string[]>>({});
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("workouts").select("id, name, tier").order("name").then(({ data }) => {
      setWorkouts((data ?? []) as Workout[]);
    });
  }, []);

  function toggleWorkout(day: string, workoutId: string) {
    setSchedule((prev) => {
      const current = prev[day] ?? [];
      const next = current.includes(workoutId)
        ? current.filter((id) => id !== workoutId)
        : [...current, workoutId];
      return { ...prev, [day]: next };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    // Remove days with no workouts
    const cleanSchedule = Object.fromEntries(
      Object.entries(schedule).filter(([, ids]) => ids.length > 0)
    );

    const res = await fetch("/api/coach/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, tier, schedule: cleanSchedule }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
      return;
    }

    router.push("/coach/programs");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/coach/programs" className="text-gray-500 text-sm hover:text-white">
          Back to programs
        </Link>
        <h1 className="text-2xl font-black text-white mt-3">New Program</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Program name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. 4-Week Speed Program" className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Access tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as "free" | "paid")} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white">
              <option value="paid">Paid only</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        {/* Schedule builder */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Schedule</h2>
          <p className="text-xs text-gray-500">Select which workouts appear on each training day. Days with no workouts selected are skipped.</p>

          {DAYS.map((day) => {
            const key = day.toLowerCase().replace(/ - /g, "_").replace(/ /g, "_");
            const selectedIds = schedule[key] ?? [];
            return (
              <div key={key} className="border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-medium mb-2">{day}</p>
                <div className="space-y-1">
                  {workouts.map((w) => (
                    <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(w.id)}
                        onChange={() => toggleWorkout(key, w.id)}
                        className="accent-white"
                      />
                      <span className="text-sm text-gray-300">{w.name}</span>
                      <span className="text-xs text-gray-600">{w.tier}</span>
                    </label>
                  ))}
                  {workouts.length === 0 && <p className="text-xs text-gray-600">No workouts created yet.</p>}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-white text-black font-bold px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save program"}
          </button>
          <Link href="/coach/programs" className="border border-gray-700 text-gray-400 px-4 py-2 rounded text-sm hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create edit program page**

Create `app/(coach)/coach/programs/[id]/edit/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Workout, Program } from "@/lib/types";

const DAYS = [
  "Week 1 - Monday", "Week 1 - Wednesday", "Week 1 - Friday",
  "Week 2 - Monday", "Week 2 - Wednesday", "Week 2 - Friday",
  "Week 3 - Monday", "Week 3 - Wednesday", "Week 3 - Friday",
  "Week 4 - Monday", "Week 4 - Wednesday", "Week 4 - Friday",
];

export default function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [programId, setProgramId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"free" | "paid">("paid");
  const [schedule, setSchedule] = useState<Record<string, string[]>>({});
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      setProgramId(id);
      const supabase = createClient();
      Promise.all([
        supabase.from("programs").select("*").eq("id", id).single(),
        supabase.from("workouts").select("id, name, tier").order("name"),
      ]).then(([programResult, workoutsResult]) => {
        if (programResult.data) {
          const p = programResult.data as Program;
          setName(p.name);
          setDescription(p.description ?? "");
          setTier(p.tier);
          setSchedule(p.schedule as Record<string, string[]>);
        }
        setWorkouts((workoutsResult.data ?? []) as Workout[]);
        setLoaded(true);
      });
    });
  }, [params]);

  function toggleWorkout(day: string, workoutId: string) {
    setSchedule((prev) => {
      const current = prev[day] ?? [];
      const next = current.includes(workoutId)
        ? current.filter((id) => id !== workoutId)
        : [...current, workoutId];
      return { ...prev, [day]: next };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const cleanSchedule = Object.fromEntries(
      Object.entries(schedule).filter(([, ids]) => ids.length > 0)
    );

    const res = await fetch(`/api/coach/programs/${programId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, tier, schedule: cleanSchedule }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
      return;
    }

    router.push("/coach/programs");
  }

  async function handleDelete() {
    if (!confirm("Delete this program? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/coach/programs/${programId}`, { method: "DELETE" });
    router.push("/coach/programs");
  }

  if (!loaded) return <div className="text-gray-500 text-sm">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/coach/programs" className="text-gray-500 text-sm hover:text-white">
            Back to programs
          </Link>
          <h1 className="text-2xl font-black text-white mt-3">Edit Program</h1>
        </div>
        <button onClick={handleDelete} disabled={deleting} className="text-sm text-red-500 hover:text-red-400 mt-6 disabled:opacity-50">
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Program name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Description (optional)</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Access tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as "free" | "paid")} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white">
              <option value="paid">Paid only</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Schedule</h2>
          {DAYS.map((day) => {
            const key = day.toLowerCase().replace(/ - /g, "_").replace(/ /g, "_");
            const selectedIds = schedule[key] ?? [];
            return (
              <div key={key} className="border border-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 font-medium mb-2">{day}</p>
                <div className="space-y-1">
                  {workouts.map((w) => (
                    <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedIds.includes(w.id)} onChange={() => toggleWorkout(key, w.id)} className="accent-white" />
                      <span className="text-sm text-gray-300">{w.name}</span>
                      <span className="text-xs text-gray-600">{w.tier}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="bg-white text-black font-bold px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
          <Link href="/coach/programs" className="border border-gray-700 text-gray-400 px-4 py-2 rounded text-sm hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/(coach)/coach/programs/"
git commit -m "feat: add coach program builder (list, create, edit)"
```

---

### Task 5: Challenge manager

**Files:**
- Create: `app/(coach)/coach/challenges/page.tsx`
- Create: `app/(coach)/coach/challenges/new/page.tsx`
- Create: `app/(coach)/coach/challenges/[id]/page.tsx`

- [ ] **Step 1: Create challenges list page**

Create `app/(coach)/coach/challenges/page.tsx`:

```tsx
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
                  {c.metric_label} — {new Date(c.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border ${c.status === "open" ? "border-green-800 text-green-400" : "border-gray-700 text-gray-500"}`}>
                {c.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create new challenge page**

Create `app/(coach)/coach/challenges/new/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewChallengePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState("");
  const [metricLabel, setMetricLabel] = useState("");
  const [metricDirection, setMetricDirection] = useState<"asc" | "desc">("desc");
  const [instructions, setInstructions] = useState("");
  const [howToRecord, setHowToRecord] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/coach/challenges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, description, metric, metric_label: metricLabel,
        metric_direction: metricDirection, instructions, how_to_record: howToRecord,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to save.");
      return;
    }

    router.push("/coach/challenges");
  }

  const inputClass = "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link href="/coach/challenges" className="text-gray-500 text-sm hover:text-white">
          Back to challenges
        </Link>
        <h1 className="text-2xl font-black text-white mt-3">New Challenge</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Challenge name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. June Pushup Challenge" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={2} placeholder="Brief description shown to athletes" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Metric key (no spaces)</label>
            <input type="text" value={metric} onChange={(e) => setMetric(e.target.value.toLowerCase().replace(/\s/g, "_"))} required placeholder="e.g. pushups_60" className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Metric label</label>
            <input type="text" value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} required placeholder="e.g. Pushups in 60 sec" className={inputClass} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Scoring direction</label>
          <select value={metricDirection} onChange={(e) => setMetricDirection(e.target.value as "asc" | "desc")} className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-white">
            <option value="desc">Higher is better (reps, distance, weight)</option>
            <option value="asc">Lower is better (time)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Instructions (shown to athletes)</label>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} required rows={3} placeholder="Describe exactly how to perform the challenge" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">How to record your score</label>
          <textarea value={howToRecord} onChange={(e) => setHowToRecord(e.target.value)} required rows={2} placeholder="e.g. Count total reps completed in 60 seconds" className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start date</label>
            <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End date</label>
            <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required className={inputClass} />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="bg-white text-black font-bold px-6 py-2 rounded text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Create challenge"}
          </button>
          <Link href="/coach/challenges" className="border border-gray-700 text-gray-400 px-4 py-2 rounded text-sm hover:text-white">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create challenge detail/submissions page**

Create `app/(coach)/coach/challenges/[id]/page.tsx`:

```tsx
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

  const leaderboard = (submissions ?? []) as SubmissionWithProfile[];

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
                <span className="text-white font-bold">{entry.score} <span className="text-gray-500 text-xs font-normal">{c.metric_label}</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create CloseButton client component**

Create `app/(coach)/coach/challenges/[id]/CloseButton.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CloseButton({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);

  async function handleClose() {
    if (!confirm("Close this challenge? Submissions will no longer be accepted.")) return;
    setClosing(true);
    await fetch(`/api/coach/challenges/${challengeId}/close`, { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={handleClose}
      disabled={closing}
      className="border border-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded text-sm mt-6 disabled:opacity-50"
    >
      {closing ? "Closing..." : "Close challenge"}
    </button>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add "app/(coach)/coach/challenges/"
git commit -m "feat: add coach challenge manager (list, create, view submissions, close)"
```

---

### Task 6: Athlete roster

**Files:**
- Create: `app/(coach)/coach/athletes/page.tsx`

- [ ] **Step 1: Create athletes roster page**

Create `app/(coach)/coach/athletes/page.tsx`:

```tsx
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

  // Get recent workout log counts per user
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
                    {a.sport ?? "No sport"}{a.position ? ` — ${a.position}` : ""} — joined {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  {weeklyLogs > 0 && (
                    <span className="text-xs text-gray-400">{weeklyLogs} workout{weeklyLogs === 1 ? "" : "s"} this week</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded border ${a.tier === "paid" ? "border-white text-white" : "border-gray-700 text-gray-500"}`}>
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/(coach)/coach/athletes/"
git commit -m "feat: add coach athlete roster with weekly activity"
```

---

### Task 7: Deploy and verify

- [ ] **Step 1: Push to GitHub**

```bash
cd /Users/quinnredmond/born2win && git push origin main
```

- [ ] **Step 2: Verify Vercel deployment**

Check Vercel build logs. Confirm all coach pages deploy without TypeScript or build errors.

- [ ] **Step 3: Fix any build errors and push**

```bash
git add -A && git commit -m "fix: resolve build issues for Plan 4" && git push origin main
```
