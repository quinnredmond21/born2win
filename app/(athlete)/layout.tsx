import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AthleteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isCoach = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_coach")
      .eq("id", user.id)
      .single();
    isCoach = profile?.is_coach === true;
  }

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-white tracking-wide">BORN 2 WIN</span>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/home" className="hover:text-white">Home</Link>
          <Link href="/programs" className="hover:text-white">Programs</Link>
          <Link href="/challenges" className="hover:text-white">Challenges</Link>
          <Link href="/progress" className="hover:text-white">Progress</Link>
          <Link href="/profile" className="hover:text-white">Profile</Link>
          {isCoach && (
            <Link href="/coach/dashboard" className="hover:text-white text-gray-600">
              Coach
            </Link>
          )}
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
