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
