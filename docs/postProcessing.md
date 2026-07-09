# Context: Three.js Dark Tech Quantum Scene Post-Processing Setup

## Goal

Implement a high-performance post-processing pipeline for a "dark tech quantum computing" scene. The scene features dark metallic surfaces, glowing quantum circuits, and neon lasers.

## Technical Specifications

- **Three.js Version**: Latest R150+ (using ES modules via 'three/addons/...')
- **Tone Mapping**: `THREE.AgXToneMapping`
- **Output Color Space**: `THREE.SRGBColorSpace`
- **Key Visual Effect**: Intense, high-energy neon bloom that handles highly saturated emissive materials cleanly without color shifting.

## Core Requirements

1. **Modules to Import**: Import `EffectComposer`, `RenderPass`, `UnrealBloomPass`, and `OutputPass` from `'three/addons/postprocessing/'`.
2. **Composer Initialization**: Replace the standard `renderer.render(scene, camera)` with an `EffectComposer` pipeline.
3. **Tone Mapping Behavior**: Ensure `renderer.toneMapping = THREE.AgXToneMapping` is respected. Ensure the `OutputPass` is placed at the very end of the composer chain so AgX tone mapping and sRGB color encoding are applied correctly after the bloom pass.
4. **Bloom Tuning for Dark Tech**:
   - Set up an `UnrealBloomPass`.
   - Use parameters optimized for dark tech: high threshold (around `0.85`) so dark metals stay clean, strong intensity (around `1.5`), and smooth radius (around `0.4`).
5. **Window Resize Handling**: Update both the renderer and the `composer` size dynamically on window resize events.
6. **Animation Loop**: Update the render loop function to call `composer.render()` instead of `renderer.render()`.

## Task for Copilot

Generate a clean, modular JavaScript/TypeScript function or class named `initPostProcessing(renderer, scene, camera)` that sets up this entire pipeline and returns the `composer` instance. Include inline comments explaining how to tweak the bloom parameters for higher energy quantum pulses.
