import type { MetadataRoute } from "next";

function getBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!envUrl) {
    const vercelUrl =
      process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
      process.env.VERCEL_URL?.trim();

    if (vercelUrl) {
      return vercelUrl.startsWith("http")
        ? vercelUrl.replace(/\/$/, "")
        : `https://${vercelUrl.replace(/\/$/, "")}`;
    }

    if (process.env.NODE_ENV === "production") {
      return "https://quantum-pulse-tau.vercel.app";
    }

    return "http://localhost:3000";
  }

  return envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/sign-in", "/sign-up"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
