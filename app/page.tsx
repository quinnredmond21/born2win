import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="px-6 py-4 flex items-center justify-between border-b border-gray-900">
        <span className="font-bold tracking-widest text-lg">BORN 2 WIN</span>
        <div className="flex gap-4 text-sm">
          <Link href="/login" className="text-gray-400 hover:text-white">Sign in</Link>
          <Link href="/signup" className="bg-white text-black px-4 py-1.5 rounded font-bold hover:bg-gray-200">
            Join
          </Link>
        </div>
      </nav>

      <section className="px-6 pt-24 pb-20 max-w-3xl">
        <p className="text-gray-500 text-sm tracking-widest uppercase mb-4">Mighty Q</p>
        <h1 className="text-5xl font-black leading-tight mb-6">
          Built Different.
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-xl">
          Most people talk about it. This is for those who show up. Train with the programs, compete in the challenges, and track how far you have come.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-white text-black font-bold px-8 py-3 rounded hover:bg-gray-200"
        >
          Start training
        </Link>
      </section>

      <section className="px-6 pb-24 max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="font-bold text-white mb-2">Programs</h2>
          <p className="text-gray-400 text-sm">
            Speed, strength, and conditioning built for athletes. Not gym-goers.
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">Monthly Challenges</h2>
          <p className="text-gray-400 text-sm">
            Compete on a live leaderboard. One challenge per month. One winner.
          </p>
        </div>
        <div>
          <h2 className="font-bold text-white mb-2">Track Your Progress</h2>
          <p className="text-gray-400 text-sm">
            Log your 40, your vertical, your lifts. See how far you have come.
          </p>
        </div>
      </section>
    </main>
  );
}
