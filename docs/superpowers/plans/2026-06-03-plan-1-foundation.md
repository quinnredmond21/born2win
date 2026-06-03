# Born 2 Win — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Born 2 Win app with Next.js, Supabase, Stripe, and PWA support — including full auth, database schema, tier enforcement, and a shell landing page.

**Architecture:** Next.js 14 App Router with Supabase for auth and data, Stripe for subscriptions, Vercel for hosting. Route groups separate the public site, athlete app, and coach dashboard. Middleware enforces auth and tier access on every request.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (auth + postgres + storage), Stripe, Vercel

---

## File Structure

```
born2win/
├── app/
│   ├── layout.tsx                        # Root layout, fonts, global styles
│   ├── page.tsx                          # Public landing page
│   ├── (auth)/
│   │   ├── login/page.tsx                # Login page
│   │   ├── signup/page.tsx               # Signup page
│   │   └── onboarding/page.tsx           # Post-signup profile setup
│   ├── (athlete)/
│   │   ├── layout.tsx                    # Athlete shell layout (nav, etc.)
│   │   └── home/page.tsx                 # Athlete home stub
│   ├── (coach)/
│   │   ├── layout.tsx                    # Coach shell layout
│   │   └── dashboard/page.tsx            # Coach dashboard stub
│   └── api/
│       └── webhooks/
│           └── stripe/route.ts           # Stripe webhook handler
├── lib/
│   ├── supabase/
│   │   ├── client.ts                     # Browser Supabase client
│   │   └── server.ts                     # Server Supabase client (cookies)
│   ├── stripe/
│   │   └── client.ts                     # Stripe server client
│   └── tier.ts                           # Tier check helpers
├── middleware.ts                          # Route protection + tier enforcement
├── supabase/
│   └── migrations/
│       └── 20260603000000_initial.sql    # Full database schema
├── public/
│   └── manifest.json                     # PWA manifest
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`

- [ ] **Step 1: Create the project**

```bash
cd /Users/quinnredmond/born2win
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

When prompted:
- Would you like to use Turbopack? **No**

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js
npm install -D supabase
```

- [ ] **Step 3: Update next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Verify the dev server starts**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000 with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with Tailwind and dependencies"
```

---

### Task 2: PWA manifest

**Files:**
- Create: `public/manifest.json`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create the manifest**

```json
{
  "name": "Born 2 Win",
  "short_name": "Born 2 Win",
  "description": "Athlete training platform by Mighty Q",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Place placeholder icon files (any 192x192 and 512x512 PNGs) at `public/icon-192.png` and `public/icon-512.png`. These will be replaced with brand assets later.

- [ ] **Step 2: Link the manifest in the root layout**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Born 2 Win",
  description: "Athlete training platform by Mighty Q",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Born 2 Win",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add public/manifest.json app/layout.tsx
git commit -m "feat: add PWA manifest and root layout"
```

---

### Task 3: Supabase project setup

**Files:**
- Create: `supabase/migrations/20260603000000_initial.sql`
- Create: `.env.local`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`

- [ ] **Step 1: Create a Supabase project**

Go to https://supabase.com, create a new project called `born2win`. Save the following values — you will need them in Step 2:
- Project URL
- Anon public key
- Service role key (Settings > API)

- [ ] **Step 2: Create `.env.local`**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not commit this file. Verify `.env.local` is in `.gitignore`.

- [ ] **Step 3: Link Supabase CLI**

```bash
npx supabase login
npx supabase link --project-ref your_project_ref
```

The project ref is the string in your Supabase project URL: `https://app.supabase.com/project/<project_ref>`

- [ ] **Step 4: Write the database migration**

Create `supabase/migrations/20260603000000_initial.sql`:

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null default '',
  sport text,
  position text,
  tier text not null default 'free' check (tier in ('free', 'paid')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  is_coach boolean not null default false,
  created_at timestamptz not null default now()
);

-- Workouts
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  exercises jsonb not null default '[]',
  tier text not null default 'paid' check (tier in ('free', 'paid')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Programs
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  schedule jsonb not null default '{}',
  tier text not null default 'paid' check (tier in ('free', 'paid')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Challenges
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  metric text not null,
  metric_label text not null,
  metric_direction text not null default 'asc' check (metric_direction in ('asc', 'desc')),
  instructions text not null,
  how_to_record text not null,
  status text not null default 'open' check (status in ('open', 'closed')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Challenge submissions (one per athlete per challenge)
create table public.challenge_submissions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score numeric not null,
  submitted_at timestamptz not null default now(),
  unique(challenge_id, user_id)
);

-- Baseline entries (one row per measurement event)
create table public.baseline_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  metric text not null check (metric in (
    'forty_yard', 'pro_agility', 'vertical_jump', 'broad_jump',
    'shuttle_300', 'mile_run', 'pushups_60', 'situps_60',
    'squat_pr', 'power_clean_pr', 'bench_pr',
    'weight_current', 'weight_target'
  )),
  value numeric not null,
  unit text not null,
  logged_at timestamptz not null default now()
);

-- Workout logs
create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  completed_at timestamptz not null default now()
);

-- Row-level security
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.programs enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_submissions enable row level security;
alter table public.baseline_entries enable row level security;
alter table public.workout_logs enable row level security;

-- Profiles: athletes read their own, coaches read all
create policy "Athletes read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Coaches read all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

create policy "Athletes update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Workouts: anyone reads free, paid users read paid, coaches read all
create policy "Anyone reads free workouts"
  on public.workouts for select
  using (tier = 'free');

create policy "Paid users read paid workouts"
  on public.workouts for select
  using (
    tier = 'paid' and exists (
      select 1 from public.profiles where id = auth.uid() and (tier = 'paid' or is_coach = true)
    )
  );

create policy "Coaches manage workouts"
  on public.workouts for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Programs: same tier logic as workouts
create policy "Anyone reads free programs"
  on public.programs for select
  using (tier = 'free');

create policy "Paid users read paid programs"
  on public.programs for select
  using (
    tier = 'paid' and exists (
      select 1 from public.profiles where id = auth.uid() and (tier = 'paid' or is_coach = true)
    )
  );

create policy "Coaches manage programs"
  on public.programs for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Challenges: everyone reads, only paid users submit
create policy "Anyone reads challenges"
  on public.challenges for select
  using (true);

create policy "Coaches manage challenges"
  on public.challenges for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Challenge submissions: paid users insert own, everyone reads
create policy "Paid users submit challenges"
  on public.challenge_submissions for insert
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.profiles where id = auth.uid() and tier = 'paid'
    )
  );

create policy "Anyone reads submissions"
  on public.challenge_submissions for select
  using (true);

-- Baseline entries: athletes manage own
create policy "Athletes manage own baselines"
  on public.baseline_entries for all
  using (auth.uid() = user_id);

create policy "Coaches read all baselines"
  on public.baseline_entries for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Workout logs: athletes manage own
create policy "Athletes manage own workout logs"
  on public.workout_logs for all
  using (auth.uid() = user_id);

create policy "Coaches read all workout logs"
  on public.workout_logs for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_coach = true));

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 5: Apply the migration**

```bash
npx supabase db push
```

Expected: migration applies with no errors. Verify tables exist in Supabase dashboard under Table Editor.

- [ ] **Step 6: Create the Supabase browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 7: Create the Supabase server client**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add supabase/ lib/supabase/ .gitignore
git commit -m "feat: add Supabase schema, migrations, and client helpers"
```

---

### Task 4: Auth middleware

**Files:**
- Create: `middleware.ts`
- Create: `lib/tier.ts`

- [ ] **Step 1: Create tier helper**

Create `lib/tier.ts`:

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getProfile(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tier, is_coach, name, sport, position")
    .eq("id", user.id)
    .single();

  return profile;
}

export function isPaid(tier: string) {
  return tier === "paid";
}

export function isCoach(profile: { is_coach: boolean } | null) {
  return profile?.is_coach === true;
}
```

- [ ] **Step 2: Create middleware**

Create `middleware.ts` at the project root:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login", "/signup", "/api/webhooks/stripe"];
const COACH_ROUTES = ["/coach"];
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Redirect logged-in users away from auth pages
  if (user && AUTH_ROUTES.some((r) => path.startsWith(r))) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Protect athlete and coach routes
  const isProtected = !PUBLIC_ROUTES.some((r) => path === r || path.startsWith(r + "/"));
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protect coach routes
  if (path.startsWith("/coach") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_coach")
      .eq("id", user.id)
      .single();

    if (!profile?.is_coach) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon-|manifest).*)"],
};
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts lib/tier.ts
git commit -m "feat: add auth middleware and tier helpers"
```

---

### Task 5: Auth pages (login and signup)

**Files:**
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/signup/page.tsx`
- Create: `app/(auth)/onboarding/page.tsx`

- [ ] **Step 1: Create login page**

Create `app/(auth)/login/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/home");
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-8">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-2 rounded disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          No account?{" "}
          <Link href="/signup" className="text-white underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create signup page**

Create `app/(auth)/signup/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2">Create your account</h1>
        <p className="text-gray-400 text-sm mb-8">Built Different.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm text-gray-400 mb-1">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-gray-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-2 rounded disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-white underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Create onboarding page**

Create `app/(auth)/onboarding/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SPORTS = [
  "Football", "Basketball", "Baseball", "Soccer", "Track & Field",
  "Wrestling", "Lacrosse", "Tennis", "Volleyball", "Swimming",
  "Cross Country", "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [sport, setSport] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ sport, position })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/home");
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h1>
        <p className="text-gray-400 text-sm mb-8">You can update this anytime.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sport" className="block text-sm text-gray-400 mb-1">
              Sport
            </label>
            <select
              id="sport"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
            >
              <option value="">Select a sport</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="position" className="block text-sm text-gray-400 mb-1">
              Position <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Wide Receiver, Point Guard"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-white"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-2 rounded disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify auth flow manually**

```bash
npm run dev
```

1. Go to http://localhost:3000/signup
2. Create an account
3. Confirm you land on `/onboarding`
4. Select a sport and continue
5. Confirm you land on `/home` (will be a stub page at this point)
6. Open Supabase dashboard > Table Editor > profiles — confirm the row exists with the sport set

- [ ] **Step 5: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add login, signup, and onboarding pages"
```

---

### Task 6: Stripe integration

**Files:**
- Create: `lib/stripe/client.ts`
- Create: `app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Create a Stripe account and products**

1. Go to https://stripe.com and create an account (or log in)
2. In test mode, go to Products > Create product
3. Create a product called "Born 2 Win — Monthly" with a recurring monthly price (set your price)
4. Create a product called "Born 2 Win — Annual" with a recurring yearly price
5. Copy the price IDs (they look like `price_xxx`) — you will need them for Plan 2

- [ ] **Step 2: Update `.env.local` with Stripe keys**

From Stripe Dashboard > Developers > API keys:

```bash
STRIPE_SECRET_KEY=sk_test_your_actual_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_key
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_ANNUAL_PRICE_ID=price_xxx
```

- [ ] **Step 3: Create Stripe server client**

Create `lib/stripe/client.ts`:

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});
```

Install the Stripe Node SDK if not already installed:

```bash
npm install stripe
```

- [ ] **Step 4: Create the Stripe webhook handler**

Create `app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: ReturnType<typeof stripe.webhooks.constructEvent>;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as { customer: string; id: string; status: string };
      const tier = subscription.status === "active" ? "paid" : "free";

      await supabase
        .from("profiles")
        .update({ tier, stripe_subscription_id: subscription.id })
        .eq("stripe_customer_id", subscription.customer);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as { customer: string };

      await supabase
        .from("profiles")
        .update({ tier: "free", stripe_subscription_id: null })
        .eq("stripe_customer_id", subscription.customer);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 5: Set up the Stripe webhook locally for testing**

```bash
# Install Stripe CLI if not already installed
brew install stripe/stripe-cli/stripe

# Log in
stripe login

# Forward events to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret it outputs and set it in `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret
```

- [ ] **Step 6: Verify the webhook works**

In a separate terminal:

```bash
stripe trigger customer.subscription.created
```

Expected: your Next.js server logs show the event received, and no errors in the webhook handler.

- [ ] **Step 7: Commit**

```bash
git add lib/stripe/ app/api/
git commit -m "feat: add Stripe client and webhook handler for subscription tier sync"
```

---

### Task 7: Shell pages for athlete and coach

**Files:**
- Create: `app/(athlete)/layout.tsx`
- Create: `app/(athlete)/home/page.tsx`
- Create: `app/(coach)/layout.tsx`
- Create: `app/(coach)/dashboard/page.tsx`

- [ ] **Step 1: Create athlete layout**

Create `app/(athlete)/layout.tsx`:

```tsx
import Link from "next/link";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-white tracking-wide">BORN 2 WIN</span>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/home" className="hover:text-white">Home</Link>
          <Link href="/programs" className="hover:text-white">Programs</Link>
          <Link href="/challenges" className="hover:text-white">Challenges</Link>
          <Link href="/progress" className="hover:text-white">Progress</Link>
          <Link href="/profile" className="hover:text-white">Profile</Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Create athlete home stub**

Create `app/(athlete)/home/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Welcome back.</h1>
      <p className="text-gray-400">Your programs and today's workout will appear here.</p>
    </div>
  );
}
```

- [ ] **Step 3: Create coach layout**

Create `app/(coach)/layout.tsx`:

```tsx
import Link from "next/link";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-white tracking-wide">BORN 2 WIN — COACH</span>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/coach/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/coach/workouts" className="hover:text-white">Workouts</Link>
          <Link href="/coach/programs" className="hover:text-white">Programs</Link>
          <Link href="/coach/challenges" className="hover:text-white">Challenges</Link>
          <Link href="/coach/athletes" className="hover:text-white">Athletes</Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Create coach dashboard stub**

Create `app/(coach)/dashboard/page.tsx`:

```tsx
export default function CoachDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Coach Dashboard</h1>
      <p className="text-gray-400">Workout builder, program manager, and athlete roster will appear here.</p>
    </div>
  );
}
```

- [ ] **Step 5: Mark your account as coach**

In the Supabase dashboard, Table Editor > profiles, find your row and set `is_coach = true`.

- [ ] **Step 6: Verify routing works**

```bash
npm run dev
```

1. Log in as your account (coach)
2. Go to http://localhost:3000/home — should show athlete home
3. Go to http://localhost:3000/coach/dashboard — should show coach dashboard
4. Log out, try http://localhost:3000/home — should redirect to /login
5. Try http://localhost:3000/coach/dashboard as a non-coach account — should redirect to /home

- [ ] **Step 7: Commit**

```bash
git add app/\(athlete\)/ app/\(coach\)/
git commit -m "feat: add athlete and coach shell layouts and stub pages"
```

---

### Task 8: Landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the landing page**

Replace `app/page.tsx` with:

```tsx
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-900">
        <span className="font-bold tracking-widest text-lg">BORN 2 WIN</span>
        <div className="flex gap-4 text-sm">
          <Link href="/login" className="text-gray-400 hover:text-white">Sign in</Link>
          <Link href="/signup" className="bg-white text-black px-4 py-1.5 rounded font-bold hover:bg-gray-200">
            Join
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 max-w-3xl">
        <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">Mighty Q</p>
        <h1 className="text-5xl font-black leading-tight mb-6">
          Built Different.
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-xl">
          Most people talk about it. This is for those who show up. Train with the programs, compete in the challenges, and track how far you've come.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-white text-black font-bold px-8 py-3 rounded hover:bg-gray-200"
        >
          Start training
        </Link>
      </section>

      {/* Pillars */}
      <section className="px-6 pb-24 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="font-bold text-white mb-2">Programs</h2>
          <p className="text-gray-400 text-sm">
            Speed, strength, and conditioning built for athletes. Not gym-goers.
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">Monthly Challenges</h2>
          <p className="text-gray-400 text-sm">
            Compete on a live leaderboard. One challenge per month. One winner.
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">Track Your Progress</h2>
          <p className="text-gray-400 text-sm">
            Log your 40, your vertical, your lifts. See how far you've come.
          </p>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify the landing page**

```bash
npm run dev
```

Go to http://localhost:3000. Confirm:
- Nav with "BORN 2 WIN", Sign in, and Join links
- Hero with "Built Different." heading
- Three pillar sections
- No emojis anywhere on the page

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page"
```

---

### Task 9: Deploy to Vercel

**Files:**
- No new files

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/your-username/born2win.git
git push -u origin main
```

- [ ] **Step 2: Deploy to Vercel**

1. Go to https://vercel.com and import the GitHub repository
2. Add all environment variables from `.env.local` to the Vercel project settings
3. Deploy

- [ ] **Step 3: Add production Stripe webhook**

In Stripe Dashboard > Developers > Webhooks, add a new endpoint:
- URL: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
- Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

Copy the signing secret and add it as `STRIPE_WEBHOOK_SECRET` in Vercel environment variables. Redeploy.

- [ ] **Step 4: Verify production**

1. Visit your Vercel URL
2. Create a test account
3. Confirm the profile row appears in Supabase
4. Confirm the landing page loads with no errors in the Vercel logs

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "chore: production deployment verified"
```

---

## What Comes Next

- **Plan 2:** Athlete App — workout player, programs page, progress tracking, baseline entry and charts
- **Plan 3:** Challenge System — challenge creation, score submission, leaderboard, free-tier gate
- **Plan 4:** Coach Dashboard — workout builder, program builder, challenge manager, athlete roster, analytics
