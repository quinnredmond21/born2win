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
