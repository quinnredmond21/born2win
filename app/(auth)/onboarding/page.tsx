"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const SPORTS = [
  "Football", "Basketball", "Baseball", "Soccer", "Track & Field",
  "Wrestling", "Lacrosse", "Tennis", "Volleyball", "Swimming",
  "Cross Country", "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [sport, setSport] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ sport, position })
      .eq("id", user.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/home");
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h1>
        <p className="text-gray-400 text-sm mb-8">You can update this anytime.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="sport" className="block text-sm text-gray-400 mb-1">
              Sport
            </label>
            <select
              id="sport"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              required
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-white"
            >
              <option value="">Select a sport</option>
              {SPORTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="position" className="block text-sm text-gray-400 mb-1">
              Position <span className="text-gray-600">(optional)</span>
            </label>
            <input
              id="position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Wide Receiver, Point Guard"
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-white"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-2 rounded disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
