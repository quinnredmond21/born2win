import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SignOutButton from "./SignOutButton";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, sport, position, tier, created_at")
    .eq("id", user.id)
    .single();

  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="max-w-sm space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">{profile?.name ?? "Athlete"}</h1>
        <p className="text-gray-500 text-sm mt-1">{user.email}</p>
        {joinDate && <p className="text-gray-600 text-xs mt-1">Member since {joinDate}</p>}
      </div>

      <div className="space-y-3">
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Sport</p>
          <p className="text-white">{profile?.sport ?? "Not set"}</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Position</p>
          <p className="text-white">{profile?.position || "Not set"}</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Membership</p>
          <p className="text-white capitalize">{profile?.tier ?? "free"}</p>
          {profile?.tier === "free" && (
            <p className="text-gray-500 text-xs mt-1">
              Upgrade to access paid programs and compete in monthly challenges.
            </p>
          )}
        </div>
      </div>

      <SignOutButton />
    </div>
  );
}
