# Born 2 Win Athlete App — Design Spec

**Date:** 2026-06-03  
**Brand:** Born 2 Win (born2winathlete.com)  
**Founder:** Mighty Q

---

## Overview

A full-stack training and athlete performance app for the Born 2 Win brand. The app serves two audiences: **Mighty Q (coach)** who builds and manages programs and challenges, and **athletes** who follow programs, track their performance, and compete in monthly challenges. The platform runs as a web app (PWA — installable on phone without an App Store) built for scale to enterprise level.

---

## Brand Identity

- Tagline: "Built Different"
- Tone: direct, no-excuses, faith-rooted, athlete-first
- Target user: serious multi-sport athletes — speed, strength, and endurance focused
- Differentiator: not a gym bro app, not a runner app — wrestling-room-style chaos training that builds real athletes
- **No emojis anywhere** — not in the UI, coach dashboard, notifications, workout copy, or any user-facing text

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js (React) |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage) |
| Payments | Stripe (subscriptions + one-time purchases) |
| Hosting | Vercel |
| Mobile | PWA (installable, push notifications, offline support) |

This is an all-managed-services stack. No custom servers to run or maintain. Scales to millions of users without infrastructure changes.

---

## Access Tiers

### Free Tier
- Create an account and athlete profile
- Browse free workouts and program previews
- View the active monthly challenge (can attempt the workout but cannot submit a score)
- See the leaderboard with a "Join Paid to Compete" prompt
- Log basic workout completions
- Access all baseline test tracking and progress over time

### Paid Tier (Subscription via Stripe)
- Full access to all training programs (speed, strength, conditioning, multi-sport)
- Full workout player with coaching notes, video demos, and step-by-step guidance
- Submit scores to monthly challenges and appear on the leaderboard
- Push notifications for new challenges, program reminders, and accountability

---

## Pages & Structure

### Public (no login)
- **Landing page** — brand story, "Built Different" messaging, social proof, call to sign up
- **Programs page** — preview of available programs, locked content visible to drive conversion
- **Challenge preview** — current monthly challenge visible, leaderboard teased with paid badge

### Athlete App (logged in)
- **Home** — current program, today's workout, active challenge status, streak
- **Workout Player** — step through exercises one at a time, video demo, Mighty Q coaching notes, log completion
- **My Progress** — all baseline stats over time, PRs, workouts completed, streak
- **Challenges** — current challenge details, leaderboard (free users see it, cannot submit)
- **Profile** — sport, position, subscription status, account settings

### Coach Dashboard (Mighty Q only)
- **Workout Builder** — create exercises (name, sets, reps, rest, video link, coaching note), group into workouts
- **Program Builder** — arrange workouts into a weekly schedule, tag as free or paid tier
- **Challenge Manager** — create monthly challenge (name, metric, instructions), open/close submissions, view all entries, mark winner
- **Athlete Roster** — view all athletes, filter by active/inactive, see subscription status and last activity
- **Analytics** — total signups, active users this week/month, free-to-paid conversion rate, challenge participation count

---

## Monthly Challenge System

- Mighty Q creates one challenge per month from the coach dashboard
- Challenges have a name, description, metric (time, reps, score), and instructions
- Free athletes can view and attempt the workout but see a paywall when trying to submit
- Paid athletes submit their score; it appears on the live leaderboard immediately
- Leaderboard is public — free users can see it (creates FOMO / conversion pressure)
- At the end of the month, Mighty Q closes submissions and crowns the winner from the dashboard
- Past challenges and results are archived and visible to all athletes

---

## Athlete Baseline Tracking

All baselines are optional. Athletes log them when they have the ability to test. Each test has built-in "How to Test Yourself" instructions inside the app — no partner or equipment required.

### Speed & Agility
- 40-yard dash
- Pro agility / 5-10-5

### Power
- Vertical jump
- Broad jump

### Conditioning
- 300-yard shuttle
- Mile run
- Max pushups (60 seconds)
- Max situps (60 seconds)

### Strength (PRs)
- Squat
- Power clean
- Bench press

### Body
- Current weight
- Target weight (supports bulk and cut tracking)

Progress page shows each metric over time as a chart — where they started vs where they are now.

---

## Workout Content Philosophy

Workouts are built by Mighty Q and reflect wrestling-room-style athlete training — not isolated machine exercises. Movements include bear crawls, sprint complexes, jump squats, push-up-to-sprint combos, circuits, wall sits, and similar functional athletic work. The workout player guides athletes through each movement with video and Mighty Q's coaching cues.

---

## Payments & Subscriptions

- Stripe handles all payments
- Athletes subscribe monthly or annually to the paid tier
- Stripe webhooks update Supabase instantly when a subscription activates or cancels
- Free tier access is always available — canceling paid drops them back to free, not out of the app

---

## Data Model (High Level)

- **users** — id, email, name, sport, position, tier (free/paid), stripe_customer_id
- **workouts** — id, name, exercises (JSON), tier, created_by
- **programs** — id, name, schedule (JSON of workout_ids by week/day), tier
- **challenges** — id, name, metric, instructions, start_date, end_date, status (open/closed)
- **challenge_submissions** — id, challenge_id, user_id, score, submitted_at
- **baseline_entries** — id, user_id, metric, value, logged_at
- **workout_logs** — id, user_id, workout_id, completed_at

---

## Out of Scope (Future)

- Team/school accounts (coaches buying for a roster)
- White-label for other coaches
- Native iOS/Android app (PWA ships first)
- Video hosting (initially use YouTube/Vimeo links)
- In-app messaging between Mighty Q and athletes
