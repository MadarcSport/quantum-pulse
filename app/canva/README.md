# Portable canvas folder

Copy this whole `canva` folder into the other project, for example into `app/canva`.

`CanvaApp.jsx` already includes the `"use client"` directive, so it can be used from a Next.js App Router project.

## Required npm dependencies

Install these in the other project:

- `react`
- `react-dom`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

The versions used in this project are documented in the root `dependencies.md` file.

## Usage

Import the component from the folder location you copied:

```jsx
import CanvaApp from "./canva";

export default function Page() {
  return <CanvaApp />;
}
```

You can override the wrapper sizes without editing the component:

```jsx
<CanvaApp canvasStyle={{ width: "100%", height: "600px" }} />
```

## Included assets

- `assets/boardC7.glb`
- `assets/rosendal.hdr`

These are loaded with relative `new URL(..., import.meta.url)` paths, so the folder does not depend on files in a public root folder.
