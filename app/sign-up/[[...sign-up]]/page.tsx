import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  const hasPublishableKey = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );
  const enableDevClerk = process.env.ENABLE_DEV_CLERK === "1";
  const shouldUseClerk =
    hasPublishableKey &&
    (process.env.NODE_ENV === "production" || enableDevClerk);

  if (!shouldUseClerk) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "32px 16px",
          background:
            "linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)",
          color: "#e2e8f0",
        }}
      >
        <p style={{ margin: 0, maxWidth: 640, lineHeight: 1.6 }}>
          Clerk auth is not enabled in this environment. Add
          <code style={{ marginLeft: 6, marginRight: 6 }}>
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          </code>
          to your environment variables, and set
          <code style={{ marginLeft: 6, marginRight: 6 }}>
            ENABLE_DEV_CLERK=1
          </code>
          for local development, then restart.
        </p>
        <p
          style={{
            margin: "12px 0 0",
            color: "#94a3b8",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          By continuing, you agree to our <Link href="/terms">Terms</Link> and
          acknowledge our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px 16px",
        background:
          "linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 12,
          justifyItems: "center",
        }}
      >
        <SignUp path="/sign-up" signInUrl="/sign-in" />
        <p
          style={{
            margin: 0,
            color: "#94a3b8",
            fontSize: 13,
            textAlign: "center",
          }}
        >
          By continuing, you agree to our <Link href="/terms">Terms</Link> and
          acknowledge our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
