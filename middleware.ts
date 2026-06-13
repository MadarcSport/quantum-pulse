import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = process.env.CLERK_SECRET_KEY;
const enableDevClerk = process.env.ENABLE_DEV_CLERK === "1";

const hasClerkEnv = Boolean(publishableKey) && Boolean(secretKey);
const shouldUseClerk =
  hasClerkEnv && (process.env.NODE_ENV === "production" || enableDevClerk);

const middleware = shouldUseClerk
  ? clerkMiddleware()
  : () => NextResponse.next();

export default middleware;

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
