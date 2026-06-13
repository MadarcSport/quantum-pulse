import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { BrandLogo } from "./components/brand-logo";
import { SiteFooter } from "./components/site-footer";
import { TopNav } from "./components/top-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stocks",
  description: "A Next.js project built with React and TypeScript.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerkEnv =
    Boolean(publishableKey) && Boolean(process.env.CLERK_SECRET_KEY);
  const enableDevClerk = process.env.ENABLE_DEV_CLERK === "1";
  const shouldUseClerk =
    hasClerkEnv && (process.env.NODE_ENV === "production" || enableDevClerk);

  return (
    <html lang="en">
      <body>
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
                  <BrandLogo size={65} />
                  <span>Pulse</span>
                </Link>

                <TopNav authEnabled />
              </nav>
            </header>

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
                  <BrandLogo size={65} />
                  <span>Quantum Pulse</span>
                </Link>

                <TopNav authEnabled={false} />
              </nav>
            </header>

            {children}
            <SiteFooter />
          </>
        )}
      </body>
    </html>
  );
}
