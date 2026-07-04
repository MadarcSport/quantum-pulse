# HDR Copilot Tutorial

This document explains, step by step, how HDR data is extracted and how the new HDR workflow is integrated into this project.

## Goal

Use HDR files as more than reflections by:

1. Measuring their lighting characteristics offline.
2. Saving those measurements in a generated data file.
3. Feeding measurements into runtime lighting/material setup.

In this project, the flow is:

1. `scripts/sample-hdr-profiles.mjs` extracts metrics from HDR files.
2. `app/canva/hdrAnalysis.generated.json` stores measured values.
3. `app/canva/hdrProfiles.js` merges measured analysis with profile configs.
4. `app/canva/Lightroom3.jsx` adapts light intensities using those metrics.
5. `app/canva/Scene.jsx` and `app/canva/Scene2.jsx` apply matching material env intensity.

## Step 1: Define HDR inputs

In `scripts/sample-hdr-profiles.mjs`, `HDR_FILES` maps a profile id to each HDR asset:

- `moonrise -> app/canva/assets/moonrise.hdr`
- `rosendal -> app/canva/assets/rosendal.hdr`
- `studio2 -> app/canva/assets/studio2.hdr`

This gives one script for many HDR files (not one file per HDR).

## Step 2: Parse HDR pixels

The script uses Three.js `HDRLoader`:

- Reads each `.hdr` file as a buffer.
- Converts it to `ArrayBuffer`.
- Calls `loader.parse(arrayBuffer)`.

Parsed data is read from:

- `parsedHdr.data` (primary)
- fallback shapes for compatibility (`image.data`, `source.data...`)

## Step 3: Compute analysis metrics

`analyzeHdrTexture(parsedHdr)` computes:

1. `averageLuminance`

- For each pixel, luminance is `0.2126*r + 0.7152*g + 0.0722*b`.
- A normalized average is produced using `average / p95`.
- Also keeps `averageLuminanceRaw` for reference.

2. `dominantColor`

- RGB channels are weighted by luminance.
- Result is normalized by max channel to keep values in `[0, 1]`.

3. `dynamicRange`

- Based on luminance percentiles.
- Uses `p99 / p01` (or fallback if needed).

Everything is rounded to 4 decimals.

## Step 4: Generate analysis JSON

The script writes output to:

- `app/canva/hdrAnalysis.generated.json`

Run command:

```bash
npm run sample:hdr
```

Script command is registered in `package.json`:

- `"sample:hdr": "node scripts/sample-hdr-profiles.mjs"`

## Step 5: Merge generated data with profile config

`app/canva/hdrProfiles.js` does two things:

1. Imports generated analysis:

- `import measuredAnalysis from "./hdrAnalysis.generated.json"`

2. Uses fallback defaults if generated data is missing:

- `resolveAnalysis(profileId)` returns measured values first, then fallback.

Each profile in `HDR_PROFILE_MAP` contains:

- Identity and asset info (`id`, `label`, `assetFile`)
- `analysis` (generated/fallback)
- `lighting` base settings (author-tuned artistic values)

Current default profile is set by:

- `DEFAULT_HDR_PROFILE_ID`

At the moment it is:

- `"rosendal"`

## Step 6: Adaptive runtime lighting in `Lightroom3`

`app/canva/Lightroom3.jsx`:

1. Chooses the HDR URL from `profileId`.
2. Reads `profile.analysis`.
3. Computes adaptive multipliers with clamping (`clamp`) to avoid unstable jumps.
4. Applies adapted values to:

- `Environment.environmentIntensity`
- `hemisphereLight.intensity`
- `ambientLight.intensity`
- key and fill spot light intensities
- directional light intensity

Important idea:

- `lighting` = artistic baseline per profile.
- `analysis` = physical-ish measurement.
- final runtime intensity = baseline x adaptive compensation.

## Step 7: Keep material reflections aligned

`app/canva/Lightroom3.jsx` exports `getHdrMaterialIntensity(profileId)`.

`app/canva/Scene.jsx` and `app/canva/Scene2.jsx` use it when setting mesh material `envMapIntensity`.

This keeps:

1. Environment lighting (`<Environment />`)
2. Scene lights
3. Material reflection intensity

all consistent with the same selected profile.

## How all files work together

Data pipeline:

1. HDR files in `app/canva/assets/*.hdr`
2. Extraction script `scripts/sample-hdr-profiles.mjs`
3. Generated metrics `app/canva/hdrAnalysis.generated.json`
4. Profile registry `app/canva/hdrProfiles.js`
5. Runtime adaptor `app/canva/Lightroom3.jsx`
6. Scene integration `app/canva/Scene.jsx` and `app/canva/Scene2.jsx`

Runtime selection:

1. Scene passes `profileId` to `Lightroom3`.
2. `Lightroom3` resolves profile + analysis.
3. Adaptive intensities are applied.
4. Scene materials use matching env map intensity.

## How to add a new HDR profile

1. Add new HDR file under `app/canva/assets/`.
2. Add it to `HDR_FILES` in `scripts/sample-hdr-profiles.mjs`.
3. Run:

```bash
npm run sample:hdr
```

4. Add profile entry in `app/canva/hdrProfiles.js`:

- `id`
- `label`
- `assetFile`
- `analysis: resolveAnalysis("newId")`
- `lighting` baseline values

5. Add URL mapping in `app/canva/Lightroom3.jsx` `HDR_URLS`.
6. Use it via `profileId="newId"` where scene is rendered.

## Notes

1. Generated JSON should be treated as build artifact from the script, not edited by hand.
2. If an HDR changes, rerun sampling to refresh analysis values.
3. Clamps in adaptive logic are intentional to keep visuals stable and predictable.
