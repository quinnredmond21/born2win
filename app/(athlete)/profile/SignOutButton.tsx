"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <button
      onClick={handleSignOut}
      className="border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 px-4 py-2 rounded text-sm transition-colors"
    >
      Sign out
    </button>
  );
}
