"use client";

import { useEffect, useState } from "react";

export function ClerkStatus() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [frontendApi, setFrontendApi] = useState("");

  useEffect(() => {
    const v = document.body?.dataset?.clerkEnabled === "1";
    const host = document.body?.dataset?.clerkFrontendApi ?? "missing";
    setEnabled(v);
    setFrontendApi(host);
    // Helpful client-side diagnostic for deployed environments
    // (does not log any secret value, only boolean/key metadata)
    console.log("[ClerkStatus]", {
      clerkEnabled: v,
      frontendApi: host,
      keyPrefix: document.body?.dataset?.clerkKeyPrefix,
      keyLength: document.body?.dataset?.clerkKeyLength,
    });
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
      <br />
      <span style={{ fontWeight: 500 }}>{frontendApi}</span>
    </div>
  );
}
