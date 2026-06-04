import Link from "next/link";
import Logo from "@/components/Logo";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <Logo />
        <div className="flex gap-6 text-sm text-gray-400">
          <Link href="/coach/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/coach/workouts" className="hover:text-white">Workouts</Link>
          <Link href="/coach/programs" className="hover:text-white">Programs</Link>
          <Link href="/coach/challenges" className="hover:text-white">Challenges</Link>
          <Link href="/coach/athletes" className="hover:text-white">Athletes</Link>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
