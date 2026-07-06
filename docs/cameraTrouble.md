# Camera Trouble: Root Cause and Fix

## Problem Summary

The 3D hero camera looked unstable across page changes.
Symptoms included:

- Same scene appearing slightly closer/farther after navigation.
- First load sometimes looking like a mobile-close framing.
- Clicking menu meshes and switching routes causing visual framing drift.

## Real Root Cause

The main issue was not the camera props alone.
It was model recentering logic in `app/canva/Scene2.jsx`:

- The model was centered with `Box3().setFromObject(modelRef.current)`.
- That bounding box included dynamic/random content (notably `InstancedMesh` particles from `FloatingSteam`).
- Because those instances move/spawn randomly, the computed center could differ between mounts.
- When center changes, the model shifts relative to a fixed camera, which _looks like camera zoom drift_.

A secondary issue was route/menu state carryover in `app/canva/CanvaApp2.jsx`:

- If `?menu` was missing/invalid, state could remain from previous view.
- Different model pose/open state amplified the perception of camera instability.

## What Was Changed

### 1) Deterministic model centering (`app/canva/Scene2.jsx`)

- Replaced broad `setFromObject` centering with a stable center computation.
- New center computation:
  - Traverses meshes only.
  - Ignores `InstancedMesh` (dynamic particles).
  - Uses geometry bounding boxes for stable union bounds.
- Cached the computed center in module scope so remounts reuse the same center.

Result: model no longer shifts unpredictably between mounts.

### 2) Deterministic menu/query reset (`app/canva/CanvaApp2.jsx`)

- On invalid or missing `menu` query param:
  - `topGroupOpen` resets to `false`.
  - `topGroupRotation` resets to `0`.
- On valid `menu`, state is set explicitly from `MENU_ROTATIONS`.

Result: route transitions no longer inherit inconsistent scene state.

### 3) Camera hardening (already applied before final fix)

- Explicit camera reset on route token changes.
- Fixed camera target.
- Locked orbit distance (`minDistance == maxDistance`) and disabled zoom/pan/rotate.

This helped, but the deterministic centering fix was the key missing piece.

## Why It Looked Like a Camera Bug

When model origin shifts a little, the object occupies a different screen area at the same camera coordinates. Users perceive this as camera distance changing, even if camera position is unchanged.

## Files Involved

- `app/canva/Scene2.jsx`
- `app/canva/CanvaApp2.jsx`
- (Observed contributor) `app/canva/FloatingSteam.jsx`

## Quick Verification Checklist

1. Open `/` directly and note framing.
2. Click mesh routes: `/stocks?menu=stocks`, `/news?menu=news`, `/ebook?menu=ebook`.
3. Return with top nav links (with and without query params).
4. Confirm framing remains stable and only intended model/menu orientation changes.
