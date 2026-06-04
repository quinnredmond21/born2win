import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Program } from "@/lib/types";

export default async function CoachProgramsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("programs")
    .select("id, name, description, tier, schedule, created_at")
    .order("created_at", { ascending: false });

  const programs = (data ?? []) as Program[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Programs</h1>
        <Link href="/coach/programs/new" className="bg-white text-black font-bold px-4 py-2 rounded text-sm">
          New program
        </Link>
      </div>

      {programs.length === 0 ? (
        <p className="text-gray-500 text-sm">No programs yet.</p>
      ) : (
        <div className="space-y-3">
          {programs.map((p) => (
            <div key={p.id} className="flex items-center justify-between border border-gray-800 rounded-lg px-4 py-3">
              <div>
                <p className="text-white font-medium">{p.name}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {Object.keys(p.schedule).length} days scheduled — {p.tier}
                </p>
              </div>
              <Link href={`/coach/programs/${p.id}/edit`} className="text-gray-400 hover:text-white text-sm">
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
