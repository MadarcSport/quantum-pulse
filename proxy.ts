import { clerkMiddleware } from "@clerk/nextjs/server";

const proxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.trim();
const enableClerkProxy =
  process.env.ENABLE_CLERK_PROXY === "1" && Boolean(proxyUrl);

export default enableClerkProxy
  ? clerkMiddleware({
      frontendApiProxy: {
        enabled: true,
      },
    })
  : clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
    // Keep this matcher for the optional Clerk FAPI proxy fallback.
    "/__clerk/(.*)",
  ],
};
