# MF Velocity Tutorial

This document explains how the `mfVelocity` field works in this project.

## 1) What the metric means

`mfVelocity` is a percent change metric built from CMF14 windows.

In this codebase, it compares:

- the latest 14-day CMF
- versus a previous 14-day CMF window shifted by 5 trading days

Then it converts that change into a percentage.

Interpretation:

- Positive values suggest money flow is strengthening.
- Negative values suggest money flow is weakening.

## 2) Base indicator: CMF (Chaikin Money Flow)

MF Velocity is built from CMF values.

For each day, we compute:

```text
Money Flow Multiplier (MFM)
= (2 * Close - High - Low) / (High - Low)
```

Equivalent form:

```text
MFM = ((Close - Low) - (High - Close)) / (High - Low)
```

Then:

```text
Money Flow Volume (MFV) = MFM * Volume
```

For a window of days (for example 14 days):

```text
CMF = Sum(MFV) / Sum(Volume)
```

Notes from implementation:

- If `High == Low`, the multiplier is forced to `0` for that day.
- Days with `volume <= 0` are skipped.
- If total volume in the window is `0`, CMF returns `null`.

## 3) The exact formula in this app

The code computes:

1. `latestCmf14d = CMF(last 14 points)`
2. `previousCmf14d = CMF(points from -19 to -5)`

That means:

- Latest window: days `[t-13 ... t]`
- Previous window: days `[t-18 ... t-5]`

So windows are both 14 days and are separated by a 5-day shift.

So:

```text
denominator = max(abs(previousCmf14d), 0.01)

MF Velocity (%)
= ((latestCmf14d - previousCmf14d) / denominator) * 100
```

In code, this is implemented as:

```ts
const latestCmf14d = computeCmf(points.slice(-14));
const previousCmf14d = computeCmf(points.slice(-19, -5));
const denominator = Math.max(Math.abs(previousCmf14d), 0.01);
const mfVelocity = ((latestCmf14d - previousCmf14d) / denominator) * 100;
```

Minimum data:

- At least 19 points are required for `mfVelocity`.

## 4) Quick numeric example

Assume:

```text
previousCmf14d = 0.040
latestCmf14d   = 0.052
```

Then:

```text
delta = 0.052 - 0.040 = 0.012
denominator = max(abs(0.040), 0.01) = 0.040

MF Velocity = (0.012 / 0.040) * 100 = +30%
```

Interpretation:

- `+30%` means CMF14 improved significantly vs the shifted reference window.

## 5) How your weather card uses it

In `app/lib/stock-forecast.ts`, weather logic uses both `cmfSpread` and `mfVelocity`:

- `Sunny` when `cmfSpread > 0.02` and `mfVelocity > 15`
- `Rainy` when `cmfSpread < -0.02` and `mfVelocity < -15`
- otherwise `Cloudy`

So:

- `cmfSpread` is still the short-vs-baseline spread signal.
- `mfVelocity` is a short/mid-term momentum signal using CMF14 with a 5-day shift.

## 6) Implementation references

- `app/lib/stock-quote.ts`
  - `computeCmf(...)`
  - `computeMoneyFlowVelocity(...)`
- `app/lib/stock-forecast.ts`
  - `calculateStockWeather(...)`
