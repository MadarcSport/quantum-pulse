import { clerkMiddleware } from "@clerk/nextjs/server";

const enableClerkProxy = process.env.ENABLE_CLERK_PROXY === "1";

export default clerkMiddleware({
  frontendApiProxy: {
    enabled: enableClerkProxy,
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
    // Keep this matcher for the optional Clerk FAPI proxy fallback.
    "/__clerk/(.*)",
  ],
};
