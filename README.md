# Stocks

A Next.js project using React and TypeScript.

## Scripts

- `npm run dev` - start the development server
- `npm run build` - build for production
- `npm run start` - start the production server
- `npm run lint` - run lint checks

## Clerk production setup

This app is prepared for Clerk with a custom production domain.

Recommended production setup:

1. Add the custom domain to Vercel.
2. Add the same root domain in the Clerk Production instance.
3. Complete Clerk's DNS records, including the Frontend API CNAME, for example `clerk.yourdomain.com`.
4. Add these Vercel Production environment variables from the same Clerk Production instance:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`
   - `CLERK_SECRET_KEY=sk_live_...`
5. Do not set `NEXT_PUBLIC_CLERK_PROXY_URL` or `NEXT_PUBLIC_CLERK_DOMAIN` unless Clerk's dashboard specifically requires that setup.
6. Redeploy after changing Clerk or Vercel environment variables.

Optional proxy fallback:

- The Clerk Frontend API proxy is disabled by default.
- If Clerk proxying is intentionally configured in the Clerk Dashboard, set `ENABLE_CLERK_PROXY=1` in Vercel and set `NEXT_PUBLIC_CLERK_PROXY_URL` to the approved proxy URL.
