"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHomeActive = pathname === "/";
  const isStocksActive =
    pathname === "/stocks" || pathname.startsWith("/stocks/");
  const isNewsActive = pathname === "/news" || pathname.startsWith("/news/");
  const authPillStyle = {
    padding: "8px 14px",
    borderRadius: 999,
    border: "2px solid rgba(56, 189, 248, 0.87)",
    background: "rgba(255, 255, 255, 0.85)",
    color: "#046cac",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  } as const;
  const mobileMenuButtonStyle = {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(148, 163, 184, 0.45)",
    background: "rgba(15, 23, 42, 0.62)",
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  } as const;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  function renderPrimaryLinks(onNavigate?: () => void) {
    return (
      <>
        <Link href="/" style={getLinkStyle(isHomeActive)} onClick={onNavigate}>
          Home
        </Link>
        <Link
          href="/stocks"
          style={getLinkStyle(isStocksActive)}
          onClick={onNavigate}
        >
          Stocks
        </Link>
        <Link
          href="/news"
          style={getLinkStyle(isNewsActive)}
          onClick={onNavigate}
        >
          News
        </Link>
      </>
    );
  }

  function renderAuthControls() {
    if (authEnabled) {
      return (
        <>
          <Show when="signed-out">
            <SignInButton mode="modal" fallbackRedirectUrl="/">
              <button type="button" style={authPillStyle}>
                Sign in
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 6px 4px 7px",
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
      );
    }

    return (
      <Link href="/sign-in" style={getLinkStyle(false)}>
        Sign in
      </Link>
    );
  }

  return (
    <div
      className="top-nav-root"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        position: "relative",
      }}
    >
      <div className="top-nav-desktop">
        {renderPrimaryLinks()}
        {renderAuthControls()}
      </div>

      <div className="top-nav-mobile">
        <button
          type="button"
          style={mobileMenuButtonStyle}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label="Toggle navigation menu"
        >
          <span
            aria-hidden="true"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 4,
              width: 16,
              height: 14,
            }}
          >
            <span
              style={{
                display: "block",
                width: "100%",
                height: 2,
                borderRadius: 999,
                background: "currentColor",
              }}
            />
            <span
              style={{
                display: "block",
                width: "100%",
                height: 2,
                borderRadius: 999,
                background: "currentColor",
              }}
            />
            <span
              style={{
                display: "block",
                width: "100%",
                height: 2,
                borderRadius: 999,
                background: "currentColor",
              }}
            />
          </span>
        </button>
        {renderAuthControls()}
      </div>

      {isMobileMenuOpen ? (
        <div id="mobile-nav-menu" className="top-nav-mobile-panel">
          {renderPrimaryLinks(() => setIsMobileMenuOpen(false))}
        </div>
      ) : null}
    </div>
  );
}
