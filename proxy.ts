import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const enableClerkProxy = process.env.ENABLE_CLERK_PROXY === "1";
const hasPublishableKey = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
);
const enableDevClerk = process.env.ENABLE_DEV_CLERK === "1";
const shouldUseClerk =
  hasPublishableKey &&
  (process.env.NODE_ENV === "production" || enableDevClerk);

const clerkProxy = clerkMiddleware({
  frontendApiProxy: {
    enabled: enableClerkProxy,
  },
});

export default shouldUseClerk ? clerkProxy : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
    // Keep this matcher for the optional Clerk FAPI proxy fallback.
    "/__clerk/(.*)",
  ],
};
