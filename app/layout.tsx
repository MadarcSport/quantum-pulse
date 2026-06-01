import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "./components/brand-logo";
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
  return (
    <html lang="en">
      <body>
        <header
          style={{
            position: "sticky",
            top: 10,
            zIndex: 40,
            backdropFilter: "blur(18px)",
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

            <TopNav />
          </nav>
        </header>

        {children}
      </body>
    </html>
  );
}
