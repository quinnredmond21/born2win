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

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (profile?.tier !== "paid") {
    return NextResponse.json({ error: "Paid membership required to submit scores." }, { status: 403 });
  }

  const { id: challengeId } = await params;

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
