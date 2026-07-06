# `renderOrder` and `frustumCulled`

`renderOrder={10}` and `frustumCulled={false}` are Three.js / React Three Fiber props.

They do **not** change the camera position, camera target, or orbit controls. They only affect how an object is rendered.

---

## `renderOrder={10}`

`renderOrder` controls the order in which Three.js draws objects.

The default value is usually:

```jsx
renderOrder={0}
```

Higher numbers are rendered later.

So this:

```jsx
renderOrder={10}
```

means: draw this object after normal objects with `renderOrder={0}`.

### Why use it?

For transparent effects like:

- smoke
- glow
- holograms
- particles

`renderOrder` can help the effect appear more correctly and reduce transparency sorting issues.

### Example

```jsx
<SmokeParticles renderOrder={10} />
```

This tells Three.js to render the smoke later than most normal objects.

> Important: `renderOrder` does not physically move the object. It only changes draw order.

---

## `frustumCulled={false}`

Three.js normally uses **frustum culling**.

Frustum culling means: if Three.js thinks an object is outside the camera view, it skips rendering that object to improve performance.

The default behavior is usually:

```jsx
frustumCulled={true}
```

Setting this:

```jsx
frustumCulled={false}
```

means: always render this object, even if Three.js thinks it is outside the camera view.

### Why use it for particles?

With particles or custom shaders, Three.js can sometimes miscalculate the visible area.

For example, the particle geometry may start in one position, but the shader visually moves the particles somewhere else. Three.js may think the original geometry is outside the camera view and stop rendering it.

Using `frustumCulled={false}` can help if smoke disappears unexpectedly.

### Downside

The object is always rendered, so it can cost slightly more performance.

---

## Useful smoke example

```jsx
<SmokeParticles
  position={[-52.57, 154.08, 184.042]}
  scale={[0.085, 0.001, 0.055]}
  renderOrder={10}
  frustumCulled={false}
/>
```

This keeps the smoke visible and renders it after most normal objects.

Again, this does **not** change the camera. It only affects how and when the smoke object is rendered.
