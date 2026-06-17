"use client";

import { useEffect, useState } from "react";

export function ClerkStatus() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    const v = document.body?.dataset?.clerkEnabled === "1";
    setEnabled(v);
    // Helpful client-side diagnostic for deployed environments
    // (does not log any secret value, only boolean presence)
    console.log("[ClerkStatus] clerkEnabled:", v);
  }, []);

  if (enabled === null) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        right: 12,
        bottom: 12,
        zIndex: 9999,
        padding: "6px 10px",
        background: enabled ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)",
        color: "#fff",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        boxShadow: "0 6px 18px rgba(2,6,23,0.4)",
      }}
    >
      {enabled ? "Clerk enabled" : "Clerk disabled"}
    </div>
  );
}
