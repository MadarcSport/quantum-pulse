# Debugging Fetch on Vercel (Stock Data)

This note explains why stock prices looked fresh on localhost but stale on Vercel, and what we changed to fix it.

## 1. Initial Symptom

- Local (`npm run dev`) showed newer stock dates/prices.
- Vercel showed older values (for example `06/05/2026` while local showed `06/08/2026`).

## 2. Why This Happened

There were two production-specific behaviors happening together:

1. Different runtime/cache behavior between local dev and Vercel production.

- `next dev` is not a true production caching model.
- On Vercel, route/page rendering and fetch caching are stricter and can expose stale patterns you do not see locally.

2. Yahoo primary quote could fail in production more often.

- `fetchStockQuote()` first calls Yahoo quote endpoint.
- If Yahoo fails, code falls back to Nasdaq historical endpoint.
- Nasdaq historical data can be delayed/EOD-like, so it may look "old" compared to fresh quote endpoints.

So the visible effect was: production often used fallback data path, while local more often succeeded on Yahoo primary path.

## 3. Root-Cause Indicators We Used

- UI source line showed `Source: Nasdaq` in production.
- Local looked fresher, indicating Yahoo path likely succeeded locally.
- Code already had fallback logic, meaning stale-looking values were likely from fallback source, not necessarily a total app failure.

## 4. Fixes Applied

## A) Force dynamic rendering for stock pages

Files:

- `app/page.tsx`
- `app/stocks/page.tsx`

Added:

```ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

Why:

- Ensures these pages are resolved at request time on Vercel.
- Prevents stale pre-render behavior for quote-dependent pages.

## B) Harden Yahoo quote requests

File:

- `app/lib/stock-quote.ts`

Changes:

- Added realistic request headers (`user-agent`, `accept`, `accept-language`, `referer`, `origin`).
- Set quote fetch to `cache: "no-store"`.
- Added non-intrusive warning logs (`warnOnce`) for failures.

Why:

- Reduces production-only blocks/rate-limit style failures.
- Improves observability without crashing the app.

## C) Added second Yahoo fallback before Nasdaq

File:

- `app/lib/stock-quote.ts`

Flow now:

1. Yahoo `v7/finance/quote`
2. Yahoo `v8/finance/chart` (1d/1m)
3. Nasdaq historical fallback

Why:

- If Yahoo primary endpoint fails, we still have another Yahoo route that can return recent market fields.
- Nasdaq fallback remains as safety net.

## D) Added optional debug badge (`quotePath`)

Files:

- `app/lib/stock-quote.ts`
- `app/components/stock-snapshot-section.tsx`
- `app/components/stock-snapshot-section.module.css`

Added `quotePath` values:

- `yahoo-v7`
- `yahoo-chart`
- `nasdaq-history`

Badge visibility:

- Shown in development by default.
- In production, shown only if `NEXT_PUBLIC_SHOW_QUOTE_DEBUG=1`.

Why:

- Makes it obvious which fetch path produced each quote.
- Very useful for diagnosing production behavior quickly.

How to read the badge:

- It appears next to the source text in each stock card, for example after `Source: Yahoo Finance (cached 60s)`.
- If badge is hidden, you will only see source text and no chip.

Badge values and meaning:

- `yahoo-v7`: Primary Yahoo quote endpoint succeeded (best/first path).
- `yahoo-chart`: Primary Yahoo quote failed, chart fallback succeeded.
- `nasdaq-history`: Both Yahoo paths failed, Nasdaq historical fallback was used.

How to enable it in production (Vercel):

1. Open your Vercel project settings.
2. Add env var `NEXT_PUBLIC_SHOW_QUOTE_DEBUG=1`.
3. Redeploy.

How to disable after debugging:

- Remove the env var, or set `NEXT_PUBLIC_SHOW_QUOTE_DEBUG=0`, then redeploy.

## 5. Why the App Stayed Stable

- All network calls are guarded with `try/catch`.
- Failed Yahoo requests return `null` and continue to fallback.
- No hard crash path was introduced.
- Lint passed after each patch.

## 6. Final Outcome

After redeploy, Vercel displayed updated data correctly.
Testing with symbols (including different exchange/index contexts like `JNJ`) worked.

## 7. Reusable Debug Checklist (Future)

When local and Vercel data differ:

1. Check if page is static/dynamic in App Router.
2. Check fetch caching mode (`no-store` vs `revalidate`).
3. Verify fallback behavior and whether fallback data source is delayed.
4. Add source-path observability (`quotePath`/badge/logs).
5. Confirm with Vercel logs and UI source labels.
6. Re-test with symbols across exchanges.

## 8. How to Ask Me Faster Next Time

Useful message format:

- Symptom: "Local shows X, Vercel shows Y"
- Scope: "Only on `/stocks` page" or "all stock cards"
- Freshness evidence: date/time shown in UI
- Current source label: Yahoo/Nasdaq
- Any recent deploy/code changes

That lets me jump directly to cache/fallback/render diagnostics.
