import { clerkFrontendApiProxy } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/__clerk")) {
    return clerkFrontendApiProxy(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|txt|xml)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
