# Fix Tile Move Style Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make sliding tiles use the same tier gradient and base shadow as stationary tiles by removing `.is-moving` skin swaps and narrowing CSS transitions to grid placement only.

**Architecture:** Single-file UI change in `Tile.vue`; parents keep passing `sliding` for `FxCanvas` and optional `data-*` debugging. No game logic changes.

**Tech Stack:** Vue 3 SFC, scoped CSS.

**Normative references:** `docs/superpowers/specs/2026-04-28-fix-tile-move-style-consistency-design.md`, `openspec/changes/fix-tile-move-style-consistency/specs/h5-2048-game/spec.md`.

---

## File map

| Path | Change |
|------|--------|
| `src/components/Tile.vue` | Remove second skin + align transitions; optional `data-sliding` on root |
| `src/components/Board.vue` | No change required (still passes `sliding`) |

---

### Task 1: Unify Tile appearance and transitions

**Files:**

- Modify: `src/components/Tile.vue`

- [ ] **Step 1: Narrow `gridPlace` to grid-only transitions**

Replace the computed style object so only grid axes animate (drop `filter` and `box-shadow` from transitions):

```ts
const gridPlace = computed(() => ({
  gridRowStart: String(props.row + 1),
  gridColumnStart: String(props.col + 1),
  transitionProperty: 'grid-row-start, grid-column-start',
  transitionDuration: `${props.animMs}ms, ${props.animMs}ms`,
  transitionTimingFunction:
    'cubic-bezier(0.38, 0.93, 0.22, 1), cubic-bezier(0.38, 0.93, 0.22, 1)',
}));
```

- [ ] **Step 2: Remove moving-only class binding; optional `data-sliding`**

Change the root `<div>` so tier classes remain but `is-moving` is not used for styling:

```vue
<div
  class="tile"
  :class="`tier-${tier}`"
  :data-sliding="sliding"
  :style="gridPlace"
>
```

- [ ] **Step 3: Delete `.is-moving.tile` CSS block**

Remove lines 76–82 in `Tile.vue` (the entire `.is-moving.tile { ... }` rule).

- [ ] **Step 4: Run unit tests**

Run:

```bash
npm run test
```

Expected: all Vitest tests pass (game engine unchanged).

- [ ] **Step 5: Manual smoke**

Run `npm run dev`, perform at least one slide and one multi-cell move; confirm no shadow/filter “swap” at start/stop vs idle tiles.

- [ ] **Step 6: Commit**

```bash
git add src/components/Tile.vue
git commit -m "fix(ui): unify tile appearance while sliding with stationary style"
```

---

## Self-review (plan vs spec)

| Spec / design requirement | Covered by |
|----------------------------|-------------|
| Same tier + base shadow while sliding | Steps 1–3 |
| No jump at animation start/end from replaced box-shadow/filter | Steps 1–3 |
| Merge feedback not on tile skin (option A) | Out of scope — no Tile merge class |
| Regression tests | Step 4 |

No placeholder steps; Board stays compatible because `sliding` prop remains on `Tile`.
