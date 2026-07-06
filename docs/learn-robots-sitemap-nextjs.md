# Learn `robots.ts` and `sitemap.ts` in Next.js App Router

This guide explains what `robots.ts` and `sitemap.ts` do, why they matter, and how they are implemented in this project.

## Why these files matter

Search engines discover and index pages more reliably when your site provides:

- `robots.txt`: crawl rules and sitemap location
- `sitemap.xml`: canonical list of important URLs

In Next.js App Router, you do not have to manually maintain static files. You can generate them with TypeScript.

## Where these files live

- `app/robots.ts` -> served as `/robots.txt`
- `app/sitemap.ts` -> served as `/sitemap.xml`

## `robots.ts` basics

In this project, `app/robots.ts` returns a `MetadataRoute.Robots` object.

Key parts:

- `rules`: tell bots what they can crawl
- `sitemap`: points bots to your sitemap URL
- `host`: your canonical host/domain

Current behavior in this repo:

- Allows crawling of public pages
- Disallows auth and API paths (`/sign-in`, `/sign-up`, `/api/`)
- Uses `NEXT_PUBLIC_SITE_URL` for production URL, with localhost fallback in dev

## `sitemap.ts` basics

In this project, `app/sitemap.ts` returns a list of URL entries (`MetadataRoute.Sitemap`).

Each entry can include:

- `url`
- `lastModified`
- `changeFrequency`
- `priority`

Current behavior in this repo:

- Adds static pages (`/`, `/stocks`, `/news`, `/ebook`, `/privacy`, `/terms`)
- Dynamically adds every news article route using `getAllArticleSlugs()`

## Why dynamic sitemap is useful

When you add a new markdown article in `app/news/*.md`, it can automatically appear in sitemap output (after deployment/build/runtime refresh depending on your setup). You do not need to manually edit XML each time.

## Environment variable to set

Set this in production:

```bash
NEXT_PUBLIC_SITE_URL=https://your-real-domain.com
```

Without it, the scaffold falls back to `http://localhost:3000`.

## How to verify locally

Run your app and open:

- `http://localhost:3000/robots.txt`
- `http://localhost:3000/sitemap.xml`

You should see crawl rules and all generated URLs.

## Common adjustments later

- Allow or disallow more paths in `robots.ts`
- Add/remove routes in `sitemap.ts`
- Pull real per-page update timestamps instead of `new Date()`
- Add image/video/news sitemap extensions if needed

## AdSense and SEO note

These files do not guarantee AdSense approval by themselves. They are trust/indexability signals that support overall quality and discoverability.
