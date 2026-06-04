import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Program } from "@/lib/types";

export default async function ProgramsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileResult, programsResult] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user!.id).single(),
    supabase.from("programs").select("id, name, description, tier, created_at").order("created_at", { ascending: false }),
  ]);

  const tier = profileResult.data?.tier ?? "free";
  const programs = (programsResult.data ?? []) as Program[];

  const freePrograms = programs.filter((p) => p.tier === "free");
  const paidPrograms = programs.filter((p) => p.tier === "paid");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Programs</h1>
        <p className="text-gray-400 text-sm">Built by Mighty Q. Pick one and run it.</p>
      </div>

      {freePrograms.length > 0 && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Free</h2>
          <div className="space-y-3">
            {freePrograms.map((program) => (
              <Link
                key={program.id}
                href={`/programs/${program.id}`}
                className="block border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
              >
                <h3 className="font-bold text-white">{program.name}</h3>
                {program.description && (
                  <p className="text-gray-500 text-sm mt-1">{program.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {paidPrograms.length > 0 && (
        <section>
          <h2 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Paid</h2>
          <div className="space-y-3">
            {paidPrograms.map((program) => {
              const locked = tier === "free";
              return (
                <Link
                  key={program.id}
                  href={locked ? "/profile" : `/programs/${program.id}`}
                  className="block border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white">{program.name}</h3>
                      {program.description && (
                        <p className="text-gray-500 text-sm mt-1">{program.description}</p>
                      )}
                    </div>
                    {locked && (
                      <span className="text-xs border border-gray-600 text-gray-400 rounded px-2 py-0.5 ml-3 shrink-0">
                        Paid only
                      </span>
                    )}
                  </div>
                  {locked && (
                    <p className="text-gray-600 text-xs mt-2">Upgrade to access this program.</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {programs.length === 0 && (
        <p className="text-gray-500">No programs available yet. Check back soon.</p>
      )}
    </div>
  );
}
