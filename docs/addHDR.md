# Add One More HDR: Integration Steps

Question: if I add one more HDR in assets, how will it be integrated?

It integrates through the same pipeline in 4 small steps.

## 1. Add file in assets

Example:

`app/canva/assets/newstudio.hdr`

## 2. Add it to the sampling script

In `sample-hdr-profiles.mjs`, add one entry in `HDR_FILES`:

```js
newstudio: path.join(projectRoot, "app/canva/assets/newstudio.hdr"),
```

## 3. Regenerate measured analysis

Run:

```bash
npm run sample:hdr
```

This updates `hdrAnalysis.generated.json` with `newstudio` metrics.

## 4. Register profile + URL for runtime

In `hdrProfiles.js`, add `newstudio` in `HDR_PROFILE_MAP`:

```js
id: "newstudio"
label
assetFile: "newstudio.hdr"
analysis: resolveAnalysis("newstudio")
lighting: { ...baseline values... }
```

In `Lightroom3.jsx`, add URL in `HDR_URLS`:

```js
newstudio: new URL("./assets/newstudio.hdr", import.meta.url).href,
```

Then use it by passing:

`profileId="newstudio"` to `Scene`/`Scene2`

or set it as `DEFAULT_HDR_PROFILE_ID`.
