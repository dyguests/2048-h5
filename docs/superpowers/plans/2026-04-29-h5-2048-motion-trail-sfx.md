# H5 2048 Motion, Trail, Friction & SFX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add eased tile motion, directional trails and friction debris on `FxCanvas`, and four short SFX (move / merge / game over / new best) with static assets and itch-friendly URLs.

**Architecture:** `useGame2048` exposes last move direction and emits logical hooks for audio; `Board` passes direction into `FxCanvas`; `FxCanvas` extends particle/trail buffers; `useAudio2048` wraps HTMLAudioElement instances with unlock-on-first-interaction.

**Tech Stack:** Vite 6, Vue 3.5, TypeScript, Canvas2D.

**Normative references:** `docs/superpowers/specs/2026-04-29-h5-2048-motion-trail-sfx-design.md`, `openspec/changes/h5-2048-motion-trail-sfx-particles/specs/h5-2048-game/spec.md`.

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/game/types.ts` | Exports `Direction` (already); reuse |
| `src/composables/useGame2048.ts` | `lastDirection`, audio hooks after settle; **when `score > prevBest && isGameOver` → only new-best sound** |
| `src/composables/useAudio2048.ts` | NEW: unlock + four players |
| `public/sfx/*.mp3` or `src/assets/sfx/*` | Short clips (placeholders OK) |
| `src/components/Board.vue` | Pass `:direction="lastDirection"` (or equivalent) to `FxCanvas` |
| `src/components/FxCanvas.vue` | Trails + friction spawn using direction |
| `src/components/Tile.vue` | Stronger cubic-bezier timing |
| `src/App.vue` | Wire swipe/board + optional `@pointerdown` unlock audio |

---

### Task 1: Direction plumbing from game to canvas

**Files:**
- Modify: `src/composables/useGame2048.ts`
- Modify: `src/components/Board.vue`

- [ ] **Step 1: Track last successful move direction**

In `useGame2048.ts`, add `const lastDirection = ref<Direction | null>(null)`. At the start of `executeMove`, after `tryMove` confirms `res.moved`, set `lastDirection.value = dir`. Export `lastDirection`.

```ts
const lastDirection = ref<Direction | null>(null);
// inside executeMove after res.moved:
lastDirection.value = dir;
```

Reset `lastDirection` to `null` when appropriate (`newGame`), optionally after animation ends — simplest: clear when `moving` becomes false after tile settle.

- [ ] **Step 2: Pass direction into Board → FxCanvas**

`Board.vue` props: add `direction: Direction | null`. Template:

```vue
<FxCanvas
  :merges="merges"
  :sliding="sliding"
  :anim-ms="animMs"
  :direction="direction"
/>
```

`App.vue`: `:direction="lastDirection"` on `Board`.

---

### Task 2: Tile easing

**Files:**
- Modify: `src/components/Tile.vue`

- [ ] **Step 1: Use stronger ease-in-out**

Replace `transitionTimingFunction` with perceptible accel/decel, e.g.:

```ts
transitionTimingFunction:
  'cubic-bezier(0.33, 1, 0.68, 1), cubic-bezier(0.33, 1, 0.68, 1)',
```

Tune visually against `ANIM_MS` without changing engine constants unless necessary.

---

### Task 3: FxCanvas — trails + friction

**Files:**
- Modify: `src/components/FxCanvas.vue`

- [ ] **Step 1: Props**

```ts
direction: {
  type: String as PropType<'up' | 'down' | 'left' | 'right' | null>,
  default: null,
},
```

Align with `Direction` union from `game/types.ts`.

- [ ] **Step 2: Trail samples**

While `sliding && direction`, each frame append `(row,col)` centers for moving tiles — derive centers via existing `cellCenter` using props from parent OR approximate from particles near tiles (minimal approach: spawn trail streak points behind tile centers along `-direction`).

Clear trail buffers when `sliding` becomes false.

- [ ] **Step 3: Friction debris**

During `sliding`, spawn low-alpha specks near trailing edge of cells along slide axis; cap particles array length (e.g. 400).

---

### Task 4: Audio composable + assets

**Files:**
- Create: `src/composables/useAudio2048.ts`
- Create: `public/sfx/move.mp3`, `merge.mp3`, `gameover.mp3`, `newbest.mp3` (or `.ogg`; placeholders acceptable short silence encoded files — minimum valid blobs)

- [ ] **Step 1: Implement `useAudio2048`**

Use **`public/sfx/`** files and **`import.meta.env.BASE_URL`** so itch.io subpaths resolve:

```ts
const base = import.meta.env.BASE_URL;

function sfx(name: string) {
  return `${base}sfx/${name}`;
}

export function useAudio2048() {
  let unlocked = false;
  function unlock() {
    unlocked = true;
  }
  function play(src: string) {
    if (!unlocked) return;
    try {
      const a = new Audio(src);
      a.volume = 0.35;
      void a.play();
    } catch {
      /* noop */
    }
  }
  return {
    unlock,
    playMove: () => play(sfx('move.mp3')),
    playMerge: () => play(sfx('merge.mp3')),
    playGameOver: () => play(sfx('gameover.mp3')),
    playNewBest: () => play(sfx('newbest.mp3')),
  };
}
```

- [ ] **Step 2: Wire unlock**

In `App.vue`, `@pointerdown.once` on `.app-shell` or Board calls `unlock()`.

---

### Task 5: Game logic → sound ordering

**Files:**
- Modify: `src/composables/useGame2048.ts`

- [ ] **Step 1: Snapshot previous best before score bump**

```ts
const prevBest = best.value;
```

After anim timeout, compute:

```ts
const becameBest = score.value > prevBest;
const dead = isGameOver(grid.value);
if (becameBest && dead) {
  audio.playNewBest(); // ONLY — no game over sound
} else if (dead) {
  audio.playGameOver();
} else if (becameBest) {
  audio.playNewBest();
}
```

Inject `audio` via closure or callbacks passed into `useGame2048({ audio })`.

Merge sounds when `res.mergedCells.length`: call `playMerge` once per successful move if merges exist.

Move sound: once per successful move when animation starts (`moving = true`).

---

### Task 6: Verify

- [ ] **Step 1: Tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Build**

```bash
npm run build && npm run preview
```

Open preview URL; confirm sfx URLs resolve under subpath.

---

## Self-review

| Design requirement | Task coverage |
|-------------------|----------------|
| Easing | Task 2 |
| Trail + friction | Task 3 |
| Four SFX + base URL | Task 4 |
| New-best-over-game-over priority | Task 5 |

Placeholder assets must be replaced or documented in README if silent files used.
