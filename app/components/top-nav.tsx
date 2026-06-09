"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";

type TopNavProps = {
  authEnabled?: boolean;
};

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

export function TopNav({ authEnabled = true }: TopNavProps) {
  const avatarScale = 1.3;
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

      {authEnabled ? (
        <>
          <Show when="signed-out">
            <SignInButton>
              <button type="button" style={getLinkStyle(false)}>
                Sign in
              </button>
            </SignInButton>
            <SignUpButton>
              <button
                type="button"
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  border: "2px solid rgba(56, 189, 248, 0.45)",
                  background: "rgba(14, 165, 233, 0.12)",
                  color: "#e0f2fe",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 7px",
                borderRadius: 999,
                border: "1px solid rgba(148, 163, 184, 0.35)",
                background: "rgba(15, 23, 42, 0.5)",
              }}
            >
              <div
                style={{
                  transform: `scale(${avatarScale})`,
                  transformOrigin: "center",
                }}
              >
                <UserButton />
              </div>
            </div>
          </Show>
        </>
      ) : (
        <>
          <Link href="/sign-in" style={getLinkStyle(false)}>
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "2px solid rgba(56, 189, 248, 0.45)",
              background: "rgba(14, 165, 233, 0.12)",
              color: "#e0f2fe",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Sign up
          </Link>
        </>
      )}
    </div>
  );
}
