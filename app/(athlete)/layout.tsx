import Link from "next/link";

export default function AthleteLayout({ children }: { children: React.ReactNode }) {
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
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
