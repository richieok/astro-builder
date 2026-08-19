# astro-builder

A SvelteKit + Three.js app for building astro-mechanical models. The scene starts empty; you add celestial bodies one by one, give each a mass, a position, and a velocity in 3D space through an inspector panel, then press Play to run an N-body gravity simulation over them.

## Stack

- [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, runes mode)
- [Three.js](https://threejs.org/) for the WebGL scene
- [Vite](https://vitejs.dev/) for dev/build tooling
- [Bun](https://bun.sh/) as the package manager and runtime

## Developing

Install dependencies and start the dev server:

```sh
bun install
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

Create a production build:

```sh
bun run build
```

Preview it locally with `bun run preview`.

> To deploy, you may need to install a [SvelteKit adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Project structure

```
src/
├── routes/
│   └── +page.svelte         # the app: 3D viewport + Bodies list + Inspector
└── lib/
    ├── stores/
    │   └── bodies.svelte.js # runes store: bodies array + selection (single source of truth)
    ├── components/
    │   ├── BodyList.svelte      # left panel: add, select, delete bodies
    │   ├── BodyInspector.svelte # right panel: edit name/mass/position/radius/color
    │   ├── SceneOutliner.svelte # generic Three.js scene-graph tree (debug tool, unwired)
    │   └── SceneTreeNode.svelte
    └── three/
        ├── world.js         # scene assembly: camera, lights, grid, bodies view, overlays
        ├── bodiesView.js    # sync layer: diffs store bodies → sphere meshes (Map<id, Mesh>)
        ├── scene.js         # Scene() factory
        ├── camera.js        # PerspectiveCamera factory
        ├── renderer.js      # WebGLRenderer factory
        ├── controls.js      # OrbitControls setup (damped)
        ├── lights.js        # ambient + hemisphere lights
        ├── materials.js     # shared material factories
        ├── objects/
        │   └── bodyMesh.js  # body sphere factory (shared unit geometry, radius via scale)
        ├── physics/
        │   └── nbody.js     # pairwise gravity, semi-implicit Euler, play/pause/reset
        ├── helpers/
        │   └── axesGizmo.js # camera-orientation gizmo (bottom-left corner)
        ├── systems/
        │   └── loop.js      # render loop: updatables + post-render overlays
        └── utils/
            ├── applyMaterial.js
            └── nodeColor.js
```

## How it works

Bodies live in a single Svelte 5 runes store (`$lib/stores/bodies.svelte.js`). Each body is plain, serializable data:

```js
{
  id, name,
  mass,                       // arbitrary units for now
  position: { x, y, z },      // scene units
  velocity: { x, y, z },      // scene units per second, drawn as an arrow
  radius,                     // display radius
  color                       // hex string
}
```

The UI panels bind directly to the store. A single `$effect` in `+page.svelte` snapshots the store on any change and calls `world.syncBodies(...)`; `bodiesView.js` diffs that data against its `Map` of id → mesh — creating, removing, and updating spheres inside a "Bodies" group. Three.js never touches Svelte proxies, and the store never touches Three.js objects.

The model persists across page refreshes: the store hydrates from `localStorage` (key `astro-builder:model`) on load, and a deep-tracking effect saves bodies, selection, and the name counter on every change. Clear the key in DevTools to reset the scene.

The simulation (`$lib/three/physics/nbody.js`) rides the same seam: pushed into the render loop's `updatables`, it integrates pairwise Newtonian gravity (semi-implicit Euler with softening) directly against the store each frame, and the sync effect carries the moving positions to the meshes. Play snapshots the initial conditions; Reset restores them. The localStorage save is debounced so the running simulation doesn't write every frame.

## Using the app

- **＋ Add body** (left panel) creates a sphere, offset along X so new bodies don't overlap, and selects it.
- **Click a row** to select a body; the selected sphere is highlighted. **×** deletes it.
- **Inspector** (right panel) edits the selected body's name, mass, position X/Y/Z, velocity X/Y/Z, radius (number input + slider), and color, all updating the scene live. A body's velocity is drawn as a yellow arrow from its surface, scaled by speed.
- **Simulation** (top of the right panel): Play/Pause (or press `Space`) runs N-body gravity over all bodies; Reset restores the positions and velocities from when Play was first pressed. The G slider tunes gravitational strength. For a circular orbit around a heavy body, aim for tangential speed √(G·M/r).
- A **View** section below the inspector toggles ambient/hemisphere lighting and intensity.

Viewport aids:

- **Grid** — a ground-plane grid for spatial reference.
- **Axes gizmo** — a small X/Y/Z indicator in the bottom-left corner that mirrors the main camera's orientation.
- **View shortcuts** — press `1` for a front view, `3` for a right-side view (+X), or `7` for a top-down view (+Y), each keeping the current zoom distance from the OrbitControls target. Ignored while typing in an input field.

## Docker

- `./dev.sh` — dev server in a container with file-watch sync (`docker compose up --build --watch`); `./dev-down.sh` tears it down.
- `docker compose -f compose.prod.yml up` — production build served by Bun on port 3000.
