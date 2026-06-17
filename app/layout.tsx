import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { BrandLogo } from "./components/brand-logo";
import { SiteFooter } from "./components/site-footer";
import { TopNav } from "./components/top-nav";
import { ClerkStatus } from "./components/clerk-status";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stocks",
  description: "A Next.js project built with React and TypeScript.",
};

function decodeClerkFrontendApi(publishableKey?: string) {
  if (!publishableKey) return "missing";

  const encodedPart = publishableKey.split("_")[2];
  if (!encodedPart) return "invalid-format";

  try {
    const padded = encodedPart.padEnd(
      encodedPart.length + ((4 - (encodedPart.length % 4)) % 4),
      "=",
    );
    const decoded = Buffer.from(padded, "base64").toString("utf8");

    if (!decoded.endsWith("$") || !decoded.includes(".")) {
      return "invalid-decoded-value";
    }

    return decoded.slice(0, -1);
  } catch {
    return "decode-failed";
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasPublishableKey = Boolean(publishableKey);
  const enableDevClerk = process.env.ENABLE_DEV_CLERK === "1";
  const shouldUseClerk =
    hasPublishableKey &&
    (process.env.NODE_ENV === "production" || enableDevClerk);
  const clerkFrontendApi = decodeClerkFrontendApi(publishableKey);
  const publishableKeyPrefix = publishableKey?.slice(0, 8) ?? "missing";
  const publishableKeyLength = publishableKey?.length.toString() ?? "0";

  return (
    <html lang="en">
      <body
        data-clerk-enabled={shouldUseClerk ? "1" : "0"}
        data-clerk-frontend-api={clerkFrontendApi}
        data-clerk-key-prefix={publishableKeyPrefix}
        data-clerk-key-length={publishableKeyLength}
      >
        {shouldUseClerk ? (
          <ClerkProvider publishableKey={publishableKey}>
            <header
              style={{
                position: "sticky",
                top: 10,
                zIndex: 40,
                backdropFilter: "blur(18px)",
                // background: "rgba(2, 6, 23, 0.78)",
                background: "rgba(2, 6, 23, 0.78)",
                borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
              }}
            >
              <nav
                style={{
                  width: "min(1120px, calc(100% - 32px))",
                  margin: "0 auto",
                  minHeight: 68,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
                aria-label="Main navigation"
              >
                <Link
                  href="/"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#f8fafc",
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <BrandLogo size={60} mobileSize={44} />
                  <span>Pulse</span>
                </Link>

                <TopNav authEnabled />
              </nav>
            </header>

            <ClerkStatus />
            {children}
            <SiteFooter />
          </ClerkProvider>
        ) : (
          <>
            <header
              style={{
                position: "sticky",
                top: 10,
                zIndex: 40,
                backdropFilter: "blur(18px)",
                // background: "rgba(2, 6, 23, 0.78)",
                background: "rgba(2, 6, 23, 0.78)",
                borderBottom: "1px solid rgba(148, 163, 184, 0.14)",
              }}
            >
              <nav
                style={{
                  width: "min(1120px, calc(100% - 32px))",
                  margin: "0 auto",
                  minHeight: 68,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
                aria-label="Main navigation"
              >
                <Link
                  href="/"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    color: "#f8fafc",
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  <BrandLogo size={65} mobileSize={44} />
                  <span>Pulse</span>
                </Link>

                <TopNav authEnabled={false} />
              </nav>
            </header>

            <ClerkStatus />
            {children}
            <SiteFooter />
          </>
        )}
      </body>
    </html>
  );
}
