# Tile Merge Scale Pop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After each settled move that includes merges, play a short CSS scale pulse (~1.12 peak, ~260ms) on each surviving merged tile id.

**Architecture:** `useGame2048` collects `survivingId` from `tryMove` result `mergeEvents`, exposes `mergePulseIds` + helper to clear after animation; `Board` passes `merge-pop` boolean per tile; `Tile.vue` runs keyframed transform only.

**Tech Stack:** Vue 3 SFC, scoped CSS.

**Normative references:** `docs/superpowers/specs/2026-04-29-tile-merge-scale-pop-design.md`, `openspec/changes/tile-merge-scale-pop/specs/h5-2048-game/spec.md`.

---

## File map

| Path | Change |
|------|--------|
| `src/composables/useGame2048.ts` | Capture `mergeEvents.survivingId`, after settle `mergePulseIds`, `clearMergePulse(id)` |
| `src/components/Board.vue` | Pass `merge-pop` into `Tile` |
| `src/components/Tile.vue` | Prop `mergePop`, class `is-merge-pop`, `@animationend`, keyframes |

---

### Task 1: Pulse state in composable

**Files:**
- Modify: `src/composables/useGame2048.ts`

- [ ] **Step 1: Add refs**

```ts
const mergePulseIds = ref(new Set<string>());

function clearMergePulse(id: string) {
  mergePulseIds.value.delete(id);
  mergePulseIds.value = new Set(mergePulseIds.value);
}
```

- [ ] **Step 2: After `spawnTile` and `moving = false`, queue survivors**

When `executeMove` finishes the slide timeout and applies `spawnTile(res.grid)`:

```ts
await nextTick();
mergePulseIds.value = new Set(res.mergeEvents.map((m) => m.survivingId));
```

At the **start** of `executeMove` (or `newGame`), clear pulse state: `mergePulseIds.value = new Set()`.

- [ ] **Step 3: Export**

```ts
return {
  ...,
  mergePulseIds,
  clearMergePulse,
};
```

---

### Task 2: Board + Tile wiring

**Files:**
- Modify: `src/components/Board.vue`
- Modify: `src/components/App.vue` or wherever `Board` is used — pass new props from composable

- [ ] **Step 1: Board props**

Accept `mergePulseIds` as `Set<string>` or pass predicate — simplest pass **function or computed map**:

Actually pass `:merge-pop="mergePulseIds.has(t.id)"` — need `mergePulseIds` as reactive Set exposed; template `.has` works if `mergePulseIds` is ref Set — ensure Vue tracks updates by replacing Set when clearing individual ids.

Pattern:

```vue
<Tile
  :merge-pop="mergePulseIds.has(t.id)"
  @merge-pop-done="clearMergePulse(t.id)"
/>
```

Vue 3: emit from Tile — Board forwards — App wires.

Alternatively composable passed down — **Board** receives `mergePulseIds` ref and `clearMergePulse`:

```vue
<Tile
  v-for="t in tiles"
  :merge-pop="mergePulseIds.has(t.id)"
  @merge-pop-done="() => clearMergePulse(t.id)"
/>
```

- [ ] **Step 2: Tile.vue**

Add prop `mergePop: boolean`. Watch `mergePop` true → requestAnimationFrame add class `is-merge-pop`.

CSS:

```css
@keyframes merge-pop-kf {
  0% { transform: scale(1); }
  45% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
.tile.is-merge-pop {
  animation: merge-pop-kf 0.26s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
```

**Important:** nest scale under inner wrapper if grid placement conflicts — if `.tile` must stay grid item, apply animation on inner `.tile-face` div wrapping span.

```vue
<div class="tile" :style="gridPlace">
  <div class="tile-face" :class="{ 'is-merge-pop': mergePopActive }">
```

Use **watch** on `mergePop`: when true set `mergePopActive = true`; on animation end emit `merge-pop-done` and set `mergePopActive = false`.

Handle `mergePop` flipping false before animation ends — rare edge case.

---

### Task 3: Verify

- [ ] **Step 1**

```bash
npm run test && npm run build
```

---

## Self-review

| Spec scenario | Task |
|---------------|------|
| Survivor pulse after merge | Task 1–2 |
| Multiple merges | Set of ids |
| No pulse without merge | mergePulseIds empty |
