import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BASELINE_METRICS } from "@/lib/types";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { metric, value } = body;

  const metricDef = BASELINE_METRICS.find((m) => m.key === metric);
  if (!metricDef) {
    return NextResponse.json({ error: "Invalid metric" }, { status: 400 });
  }

  const numericValue = parseFloat(value);
  if (isNaN(numericValue) || numericValue <= 0) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  const { error } = await supabase
    .from("baseline_entries")
    .insert({ user_id: user.id, metric, value: numericValue, unit: metricDef.unit });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
