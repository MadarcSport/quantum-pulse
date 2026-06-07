"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function getLinkStyle(isActive: boolean) {
  if (isActive) {
    return {
      padding: "8px 14px",
      borderRadius: 999,
      border: "2px solid rgba(56, 189, 248, 0.45)",
      background: "rgba(14, 165, 233, 0.12)",
      color: "#e0f2fe",
      fontSize: 14,
      fontWeight: 700,
    } as const;
  }

  return {
    padding: "8px 14px",
    borderRadius: 999,
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: 600,
  } as const;
}

export function TopNav() {
  const pathname = usePathname();
  const isHomeActive = pathname === "/";
  const isStocksActive =
    pathname === "/stocks" || pathname.startsWith("/stocks/");
  const isNewsActive = pathname === "/news" || pathname.startsWith("/news/");

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <Link href="/" style={getLinkStyle(isHomeActive)}>
        Home
      </Link>
      <Link href="/stocks" style={getLinkStyle(isStocksActive)}>
        Stocks
      </Link>
      <Link href="/news" style={getLinkStyle(isNewsActive)}>
        News
      </Link>
    </div>
  );
}
