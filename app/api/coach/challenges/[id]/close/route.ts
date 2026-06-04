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
