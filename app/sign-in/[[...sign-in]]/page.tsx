import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  const hasClerkEnv =
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
    Boolean(process.env.CLERK_SECRET_KEY);

  if (!hasClerkEnv) {
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
          Clerk auth is not configured yet. Add
          <code style={{ marginLeft: 6, marginRight: 6 }}>
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          </code>
          and
          <code style={{ marginLeft: 6, marginRight: 6 }}>
            CLERK_SECRET_KEY
          </code>
          to <code>.env.local</code> and restart the dev server.
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
        <SignIn path="/sign-in" signUpUrl="/sign-up" />
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
