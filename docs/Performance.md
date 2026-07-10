# Performance

This note explains the main performance improvements made to the homepage and the 3D Canva scene.

## Goal

The homepage originally had a slower Largest Contentful Paint (LCP) because the page waited for stock data before rendering the visible hero area.

After the changes, the hero section and Canva can render first, while stock cards load separately.

## Problem before

The homepage did this:

1. User opened `/`.
2. Next.js started rendering the homepage.
3. The server fetched stock quote, volume, and CMF data.
4. The server waited for all stock data to finish.
5. Only after that, the page HTML could render.
6. The hero/Canva appeared later, increasing LCP.

The slow part was not mainly the 3D model or the title animation. The main blocker was the stock data fetching path.

## Main improvement: streaming with Suspense

We moved the stock fetching into a separate async server component:

- `StockPreviewSections`

That component fetches:

- `fetchStockQuote()`
- `fetchAverageVolume7d()`
- `fetchAverageVolume90d()`
- `fetchCmfMetrics()`

Then we wrapped it in React `Suspense`:

```tsx
<HeroSection3 />

<Suspense fallback={<StockPreviewFallback enabledStocks={enabledStocks} />}>
  <StockPreviewSections enabledStocks={enabledStocks} />
</Suspense>
```

This means:

- `HeroSection3` renders immediately.
- The 3D Canva can appear without waiting for stock data.
- Stock cards load later inside the `Suspense` boundary.
- Next.js can stream the page progressively.

## Why this improves LCP

LCP measures when the largest visible content appears.

The hero section is above the fold and important for LCP. By letting it render before the stock cards finish fetching, the browser can paint the main visual content much earlier.

Before:

```text
Hero waits for stock data → slower LCP
```

After:

```text
Hero renders first → stock cards stream later → faster LCP
```

In local production testing, the homepage LCP improved to around `0.62 s`.

## Avoiding layout shift

After adding `Suspense`, we saw a high layout shift score because the fallback was too small.

The first fallback was only a small loading card. When real stock cards loaded, they pushed the page content down.

That caused Cumulative Layout Shift (CLS).

To fix this, we replaced the small fallback with skeleton stock cards:

- `StockPreviewFallback`
- `StockPreviewSkeletonCard`
- `SkeletonBar`

The skeletons reuse the same stock card CSS classes as the real cards. This reserves similar space before the real data arrives.

Result:

```text
Small fallback → real cards = big layout shift
Skeleton cards → real cards = much smaller layout shift
```

## Removing blocking snapshot writes

We also removed `saveStockIndicatorSnapshot()` from the normal homepage render path.

Snapshot saving should not block a user loading the homepage. It is better handled by the scheduled capture API/cron job.

This reduces unnecessary server work during normal page visits.

## 3D Canva offscreen optimization

The 3D Canva remains mounted, but animations/rendering pause when it scrolls outside the viewport.

This was done with:

- `IntersectionObserver`
- an `isCanvasVisible` state
- React Three Fiber `frameloop` switching between:
  - `"always"` when visible
  - `"demand"` when offscreen
- `isActive` passed into animation components

When the canvas is not visible, `useFrame()` animation work is skipped in:

- `BoardC7Menu`
- `FloatingSteam`
- `FloatingSteam2`
- `SmokeParticles`

This helps reduce CPU/GPU usage while the user is reading lower parts of the page.

## Title animation note

The `Quantum Stocks` title originally had a GSAP animation with opacity and blur.

We tested changing it to a lighter animation, but the main LCP improvement came from moving stock fetching behind `Suspense`, not from the title animation.

The original title animation was restored.

## Summary

Performance was improved mainly by separating critical and non-critical work:

- Critical: hero section and 3D Canva
- Non-critical: stock cards and external stock data fetching

The key pattern is:

```text
Render important above-the-fold UI first.
Stream slower data-driven sections later with Suspense.
Reserve layout space with skeletons to avoid CLS.
Pause expensive animations when offscreen.
```
