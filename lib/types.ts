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
  schedule: Record<string, string[]>;
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
