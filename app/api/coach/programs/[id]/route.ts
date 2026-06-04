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
