"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CloseButton({ challengeId }: { challengeId: string }) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);

  async function handleClose() {
    if (!confirm("Close this challenge? Submissions will no longer be accepted.")) return;
    setClosing(true);
    await fetch(`/api/coach/challenges/${challengeId}/close`, { method: "POST" });
    router.refresh();
  }

  return (
    <button
      onClick={handleClose}
      disabled={closing}
      className="border border-gray-600 text-gray-400 hover:text-white px-4 py-2 rounded text-sm mt-6 disabled:opacity-50"
    >
      {closing ? "Closing..." : "Close challenge"}
    </button>
  );
}
