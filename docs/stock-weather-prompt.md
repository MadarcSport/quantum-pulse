# Specification: Stock Weather / Forecast Component

## Context
I am building an informative stock analysis platform using Next.js, React, and TypeScript. The UI uses a dark-themed Tailwind CSS design layout. I want to build a "Stock Weather Forecast" feature that synthesizes technical volume and money flow data into a user-friendly, non-financial-advice visual forecast (Sunny, Cloudy, Rainy).

## Existing Data Structures Available
The following raw metrics have already been calculated in my data layer and are available to pass as props:
- `volumeSurgePct` (number): The % divergence of today's volume vs the 90d average volume (e.g., +27.9).
- `cmfSpread` (number): The raw difference between the latest 7d CMF and the rolling 90d average CMF (e.g., +0.053).
- `mfVelocity` (number): The rate of change % of money flow acceleration (e.g., +45.2).

---

## Technical Tasks Requested

### Task 1: Create the Logic Engine (`app/lib/stock-forecast.ts`)
Write a pure TypeScript function named `calculateStockWeather` that takes `volumeSurgePct`, `cmfSpread`, and `mfVelocity` as parameters and outputs a structured forecast object.

#### Logic Criteria:
1. **Sunny (Bullish Skies):** Triggered when `cmfSpread > 0.02` AND `mfVelocity > 15`. It signifies that money flow velocity and institutional accumulation are accelerating together.
2. **Rainy (Bearish Fronts):** Triggered when `cmfSpread < -0.02` AND `mfVelocity < -15`. It signifies that capital velocity is draining rapidly relative to the historical baseline.
3. **Cloudy (Uncertain/Mixed):** The fallback state. It should catch all "neutral" behavior or mixed signals (such as a massive `volumeSurgePct` but a completely flat `cmfSpread` near 0, which indicates institutional churning/indecision).

### Task 2: Create the UI Component (`app/components/stock-forecast-card.tsx`)
Create a responsive React functional component styled with Tailwind CSS matching a premium dark mode theme. 

#### Visual Specifications:
- **Card Styling:** Semi-transparent background (`bg-slate-900/50`), thin slate borders (`border-slate-800`), backdrop blur (`backdrop-blur-sm`), rounded corners (`rounded-xl`).
- **Icons:** Provide 3 distinct inline, lightweight SVG icons representing the weather:
  - *Sunny:* A glowing yellow/amber sun icon (`text-amber-400`).
  - *Cloudy:* A subtle gray overlapping cloud icon (`text-slate-400`).
  - *Rainy:* A slate-blue cloud with falling rain streaks (`text-blue-400`).
- **Animate State Shifts:** Use standard Tailwind animation classes (like `animate-pulse` or subtle smooth transitions) so the icon feels dynamic when rendering.
- **Informative Disclaimer:** Include a small text footnote inside the card explicitly stating that this is an experimental mathematical synthesis of volume data for educational purposes, not live financial forecasting or trade advice.

---

## Code Generation Output Requirements
Please generate the complete, production-ready TypeScript code for both files. Ensure clean type safety, no external icon library dependencies (use pure SVG paths), and idiomatic Tailwind layout classes.