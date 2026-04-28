import { shallowRef, ref, computed, nextTick, onMounted } from 'vue';
import type { Direction } from '../game/types';
import {
  cloneGrid,
  createInitialGrid,
  tryMove,
  spawnTile,
  isGameOver,
  hasWon,
} from '../game/engine';
import { flattenGrid, buildTargetsMap } from '../game/view';
import type { TileVM } from '../game/view';

const BEST_KEY = 'cute2048-best';
export const ANIM_MS = 220;

export function useGame2048() {
  const grid = shallowRef(createInitialGrid());
  const score = ref(0);
  const best = ref(0);
  const moving = ref(false);
  const animTiles = shallowRef<TileVM[]>([]);
  const lastMergeCells = ref<{ row: number; col: number }[]>([]);

  const lost = ref(false);
  const winBanner = ref(false);

  const tilesVm = computed<TileVM[]>(() => {
    if (moving.value && animTiles.value.length) return animTiles.value;
    return flattenGrid(grid.value);
  });

  onMounted(() => {
    const n = Number(localStorage.getItem(BEST_KEY));
    if (!Number.isNaN(n)) best.value = n;
  });

  async function executeMove(dir: Direction) {
    if (moving.value || lost.value) return;
    const before = cloneGrid(grid.value);
    const res = tryMove(before, dir);
    if (!res.moved) return;

    const targets = buildTargetsMap(before, res.grid, res.mergeEvents);

    animTiles.value = flattenGrid(before);
    lastMergeCells.value = res.mergedCells;
    moving.value = true;

    await nextTick();
    animTiles.value = animTiles.value.map((t) => {
      const p = targets.get(t.id);
      const pos = p ?? { r: t.row, c: t.col };
      return {
        ...t,
        row: pos.r,
        col: pos.c,
      };
    });

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, ANIM_MS);
    });

    grid.value = spawnTile(res.grid);
    score.value += res.scoreDelta;
    if (score.value > best.value) {
      best.value = score.value;
      localStorage.setItem(BEST_KEY, String(best.value));
    }

    moving.value = false;
    animTiles.value = [];

    if (hasWon(grid.value) && !winBanner.value) winBanner.value = true;
    if (isGameOver(grid.value)) lost.value = true;
  }

  function dismissWin() {
    winBanner.value = false;
  }

  function newGame() {
    grid.value = createInitialGrid();
    score.value = 0;
    lost.value = false;
    moving.value = false;
    animTiles.value = [];
    winBanner.value = false;
  }

  function continueAfterWin() {
    winBanner.value = false;
  }

  return {
    grid,
    score,
    best,
    lost,
    winBanner,
    moving,
    tilesVm,
    executeMove,
    newGame,
    dismissWin,
    continueAfterWin,
    lastMergeCells,
    ANIM_MS,
  };
}
