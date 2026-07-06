# Performance Proof Checklist

Use this document to validate and present production-grade 3D web performance.

## 1) Test Matrix

| Device                   | OS            | Browser     | Network | Result |
| ------------------------ | ------------- | ----------- | ------- | ------ |
| iPhone 13                | iOS 18        | Safari      | Wi-Fi   |        |
| Pixel 7                  | Android 16    | Chrome      | 4G      |        |
| Mid-range Android        | Android 14    | Chrome      | 4G      |        |
| Desktop (Integrated GPU) | Windows/macOS | Chrome/Edge | Wi-Fi   |        |

## 2) Core Performance Targets

- First meaningful visual in hero: `< 2.5s` on mobile 4G
- Stable framerate during idle interaction: `>= 50 FPS` (mobile), `>= 55 FPS` (desktop)
- Interaction latency (tap/click to response): `< 100ms`
- Route/page switch with interactive elements: no visible jank
- No major long task spikes (`> 50ms`) during camera/menu interaction

## 3) Measurements To Capture

### FPS + Smoothness

- Record average FPS and 1% low FPS during:
- idle scene
- active menu interaction
- page transition with clickable elements

### Main Thread + Long Tasks

- Chrome DevTools Performance profile
- Count long tasks (`> 50ms`) during interaction
- Confirm no repeated scripting spikes from event handlers

### Memory Stability

- Open/close 3D menu repeatedly for 2-3 minutes
- Confirm memory does not continuously climb (no leak trend)
- Verify proper disposal of geometries/textures/materials when unmounted

### GPU Cost

- Check shader complexity and overdraw
- Validate material pipeline (`onBeforeCompile`) does not trigger expensive recompile loops
- Keep draw calls and texture sizes within mobile-safe budget

## 4) UX + Accessibility Proof

- Touch targets are reliable on small screens
- Keyboard navigation works for menu actions
- Visible focus states on interactive items
- Fallback behavior if WebGL context fails
- Motion sensitivity option (reduced motion path)

## 5) 3D Asset Optimization Proof

- Clean topology from C4D prior to export
- GLB size budget respected (target and actual documented)
- Mesh count and draw call count documented
- Texture resolution and compression documented
- Draco/mesh compression status documented (if used)

## 6) Results Snapshot (Fill This)

| Metric                      | Mobile Result | Desktop Result | Pass/Fail |
| --------------------------- | ------------- | -------------- | --------- |
| Hero meaningful visual time |               |                |           |
| Avg FPS (interaction)       |               |                |           |
| 1% low FPS                  |               |                |           |
| Interaction latency         |               |                |           |
| Long tasks count            |               |                |           |
| Memory trend (3 min)        |               |                |           |
| Route switch smoothness     |               |                |           |

## 7) Evidence Links

- Lighthouse report:
- DevTools Performance recording:
- Mobile screen capture (interaction):
- Desktop screen capture (interaction):
- Notes on shader/material decisions:

## 8) Executive Summary Template

This interactive 3D menu was tested on real mobile and desktop devices. Performance remained stable during menu interaction and page transitions with clickable elements. Asset topology was optimized in C4D before GLB export, and custom `onBeforeCompile` shader work reduced render overhead while preserving visual quality. The experience meets production targets for responsiveness, smoothness, and usability.
