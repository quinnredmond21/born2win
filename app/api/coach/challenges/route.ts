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
