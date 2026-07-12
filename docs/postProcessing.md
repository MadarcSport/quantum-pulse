# Post-processing in Three.js / React Three Fiber

Post-processing means applying visual effects **after** the 3D scene has been rendered. Instead of drawing the scene directly to the screen, the renderer first draws it into an internal texture. Then effects are applied on top of that final image.

It is similar to adding a cinematic filter after taking a photo.

Common examples:

- Bloom / glow
- Vignette
- Depth of field
- Chromatic aberration
- Ambient occlusion
- Tone mapping / color grading
- Noise / film grain
- Outline

---

## 1. Installation for React Three Fiber

For a Next.js + React Three Fiber project, the common package is:

```bash
npm install @react-three/postprocessing postprocessing
```

The important imports usually look like this:

```jsx
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
```

Then effects are placed **inside** the `<Canvas>`:

```jsx
<Canvas>
  <Scene />

  <EffectComposer>
    <Vignette darkness={0.45} offset={0.25} />
  </EffectComposer>
</Canvas>
```

In our project, this would normally belong near the Canvas code, for example in `app/canva/CanvaApp2.jsx`, not in the main home page.

---

## 2. Installation for plain Three.js

If using plain Three.js without React Three Fiber, post-processing is done with Three.js addons:

```js
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
```

Basic structure:

```js
const composer = new EffectComposer(renderer);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.4, // strength
  0.3, // radius
  0.85, // threshold
);
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
```

Without post-processing, the render loop is usually:

```js
renderer.render(scene, camera);
```

With post-processing, it becomes:

```js
composer.render();
```

---

## 3. The main post-processing effects

### Bloom

Bloom makes bright areas glow.

Good for:

- LEDs
- neon lines
- emissive screens
- futuristic UI
- lasers

Risk:

- Can quickly look fake or washed out.
- If the threshold is too low, the whole scene starts glowing.

Important settings:

```jsx
<Bloom
  intensity={0.15}
  luminanceThreshold={0.85}
  luminanceSmoothing={0.15}
  mipmapBlur
/>
```

Meaning:

- `intensity`: glow strength.
- `luminanceThreshold`: how bright a pixel must be before it glows.
- `luminanceSmoothing`: softness of the threshold.
- `mipmapBlur`: smoother bloom.

Rule of thumb:

- Low `luminanceThreshold`, like `0.01`, makes almost everything bloom.
- High `luminanceThreshold`, like `0.85`, makes only bright parts bloom.

Performance cost: **medium**.

---

### Vignette

Vignette darkens the corners of the image.

Good for:

- cinematic focus
- darker mood
- guiding the eye toward the center
- subtle polish

Example:

```jsx
<Vignette offset={0.25} darkness={0.45} />
```

Meaning:

- `offset`: where the corner darkening starts.
- `darkness`: strength of the dark corners.

Performance cost: **very low**.

This is usually one of the safest effects to test first.

---

### Depth of field

Depth of field simulates a camera lens. One distance is sharp, while foreground/background becomes blurred.

Good for:

- product-shot style
- cinematic closeups
- focusing attention on a single object

Example:

```jsx
<DepthOfField focusDistance={0.02} focalLength={0.025} bokehScale={1.2} />
```

Risk:

- Can make the scene look blurry.
- Can be annoying if the camera or object moves.
- More expensive than vignette.

Performance cost: **medium to high**.

---

### Chromatic aberration

Chromatic aberration creates a small RGB color split around edges.

Good for:

- sci-fi
- glitch style
- cyberpunk mood

Example:

```jsx
<ChromaticAberration offset={[0.0004, 0.0004]} />
```

Risk:

- Can look cheap if too strong.
- Can reduce readability.

Performance cost: **low to medium**.

Use very subtle values.

---

### SSAO / ambient occlusion

SSAO adds soft shadowing in creases and contact areas.

Good for:

- adding depth
- making objects feel grounded
- improving corners and small details
- making mechanical objects feel more realistic

Example:

```jsx
<SSAO samples={16} radius={0.08} intensity={8} />
```

Risk:

- Can create noise or dirty shadows.
- Can be expensive, especially on mobile.

Performance cost: **medium to high**.

For our board scene, SSAO could be visually interesting, but it should be tested carefully.

---

### Tone mapping / color grading

Tone mapping controls how HDR brightness is converted to screen brightness. It changes contrast, highlight rolloff, and overall cinematic feel.

In Three.js, this can be configured directly on the renderer:

```jsx
<Canvas
  gl={{
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 0.55,
  }}
>
  <Scene />
</Canvas>
```

Common tone mapping options:

```js
THREE.NoToneMapping;
THREE.LinearToneMapping;
THREE.ReinhardToneMapping;
THREE.CineonToneMapping;
THREE.ACESFilmicToneMapping;
THREE.AgXToneMapping;
```

Important setting:

```js
toneMappingExposure;
```

Meaning:

- lower value = darker
- higher value = brighter

Performance cost: **low**.

Note: In our project, the original Canvas already used:

```js
toneMapping: THREE.ACESFilmicToneMapping,
toneMappingExposure: 0.55,
```

So this is not necessarily an extra post-processing layer; it is part of the renderer configuration.

---

## 4. Recommended order of effects

If testing effects in a real project, start simple:

1. Tone mapping / exposure tuning
2. Vignette
3. Very subtle bloom only if emissive materials need glow
4. SSAO if the scene needs more depth
5. Depth of field only for cinematic shots
6. Chromatic aberration only for a deliberate sci-fi/glitch style

---

## 5. Performance comparison

Approximate cost from cheapest to most expensive:

1. Tone mapping: low
2. Vignette: very low
3. Chromatic aberration: low to medium
4. Bloom: medium
5. Depth of field: medium to high
6. SSAO / ambient occlusion: medium to high

On mobile, use lower quality settings:

```jsx
<EffectComposer
  multisampling={isMobile ? 0 : 2}
  resolutionScale={isMobile ? 0.65 : 0.85}
>
  <Vignette darkness={0.4} offset={0.25} />
</EffectComposer>
```

---

## 6. How to keep effects easy to disable

Use simple booleans:

```jsx
const ENABLE_VIGNETTE = true;
const ENABLE_BLOOM = false;

<Canvas>
  <Scene />

  {ENABLE_VIGNETTE || ENABLE_BLOOM ? (
    <EffectComposer>
      {ENABLE_VIGNETTE ? <Vignette darkness={0.45} offset={0.25} /> : null}
      {ENABLE_BLOOM ? (
        <Bloom
          intensity={0.12}
          luminanceThreshold={0.85}
          luminanceSmoothing={0.15}
          mipmapBlur
        />
      ) : null}
    </EffectComposer>
  ) : null}
</Canvas>;
```

This makes it easy to compare:

- original scene
- vignette only
- bloom only
- combined effects

---

## 7. Notes for this project

For the current board / Lightroom scene, post-processing should be used carefully.

Best candidates:

- **Vignette**: cheap and subtle; good for cinematic focus.
- **Tone mapping exposure**: useful, but the scene already has tone mapping.
- **SSAO**: maybe useful for mechanical depth, but needs performance testing.

Less ideal:

- **Bloom**: can make the scene too bright or artificial if the model is not built around emissive materials.
- **Depth of field**: may make the model feel blurry.
- **Chromatic aberration**: can look glitchy or reduce quality if overused.

Current safe baseline for this project:

```jsx
gl={{
   toneMapping: THREE.ACESFilmicToneMapping,
   toneMappingExposure: 0.55,
}}
```

That returns the scene to the basic look without an extra post-processing composer.
