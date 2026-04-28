import type { Cell, Direction, Grid, MergeEvent, MoveResult } from './types';

export const SIZE = 4;

/** ~90% new tile is 2 */
export const PROB_TWO = 0.9;

export function createEmptyGrid(): Grid {
  return Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => null),
  );
}

export function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.map((c) => (c ? { ...c } : null)));
}

function gridsEqual(a: Grid, b: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const x = a[r][c];
      const y = b[r][c];
      if ((x === null) !== (y === null)) return false;
      if (x && y && (x.value !== y.value || x.id !== y.id)) return false;
    }
  }
  return true;
}

interface SlideResult {
  line: (Cell | null)[];
  scoreDelta: number;
  merges: { idx: number; survivingId: string; removedId: string; value: number }[];
}

function slideLine(nonNull: Cell[]): SlideResult {
  const queue = [...nonNull];
  const out: Cell[] = [];
  let scoreDelta = 0;
  const merges: SlideResult['merges'] = [];
  let i = 0;
  while (i < queue.length) {
    const a = queue[i]!;
    if (i + 1 < queue.length && queue[i + 1]!.value === a.value) {
      const b = queue[i + 1]!;
      const value = a.value * 2;
      out.push({ id: a.id, value });
      scoreDelta += value;
      merges.push({
        idx: out.length - 1,
        survivingId: a.id,
        removedId: b.id,
        value,
      });
      i += 2;
    } else {
      out.push({ ...a });
      i += 1;
    }
  }
  const line: (Cell | null)[] = [
    ...out,
    ...Array(SIZE - out.length).fill(null),
  ] as (Cell | null)[];
  return { line, scoreDelta, merges };
}

function moveLeft(grid: Grid): MoveResult {
  const before = cloneGrid(grid);
  const next = createEmptyGrid();
  let scoreDelta = 0;
  const mergedCells: { row: number; col: number }[] = [];
  const mergeEvents: MergeEvent[] = [];

  for (let r = 0; r < SIZE; r++) {
    const nonNull = before[r].filter((c): c is Cell => c !== null);
    const { line, scoreDelta: sd, merges } = slideLine(nonNull);
    scoreDelta += sd;
    next[r] = line;
    for (const m of merges) {
      mergedCells.push({ row: r, col: m.idx });
      mergeEvents.push({
        row: r,
        col: m.idx,
        survivingId: m.survivingId,
        removedId: m.removedId,
        value: m.value,
      });
    }
  }

  return {
    grid: next,
    scoreDelta,
    moved: !gridsEqual(before, next),
    mergedCells,
    mergeEvents,
  };
}

function flipH(g: Grid): Grid {
  return g.map((row) => [...row].reverse() as (Cell | null)[]);
}

function transpose(g: Grid): Grid {
  const z = createEmptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      z[r][c] = g[c][r] ? { ...g[c][r]! } : null;
    }
  }
  return z;
}

/** Remap merge events when grid is transformed for directional moves. */
function remapMerge(
  events: MergeEvent[],
  map: (row: number, col: number) => { row: number; col: number },
): MergeEvent[] {
  return events.map((e) => {
    const p = map(e.row, e.col);
    return { ...e, row: p.row, col: p.col };
  });
}

/** Bottom row index first among non-null cells — merge direction "down". */
function extractColumnBottomFirst(grid: Grid, col: number): Cell[] {
  const out: Cell[] = [];
  for (let r = SIZE - 1; r >= 0; r--) {
    const cell = grid[r][col];
    if (cell) out.push({ ...cell });
  }
  return out;
}

function moveDown(grid: Grid): MoveResult {
  const before = cloneGrid(grid);
  const next = createEmptyGrid();
  let scoreDelta = 0;
  const mergedCells: { row: number; col: number }[] = [];
  const mergeEvents: MergeEvent[] = [];

  for (let c = 0; c < SIZE; c++) {
    const bottomFirst = extractColumnBottomFirst(before, c);
    const { line, scoreDelta: sd, merges } = slideLine(bottomFirst);
    scoreDelta += sd;
    for (let i = 0; i < SIZE; i++) {
      const r = SIZE - 1 - i;
      next[r][c] = line[i] ?? null;
    }
    for (const m of merges) {
      const rowIdx = SIZE - 1 - m.idx;
      mergedCells.push({ row: rowIdx, col: c });
      mergeEvents.push({
        row: rowIdx,
        col: c,
        survivingId: m.survivingId,
        removedId: m.removedId,
        value: m.value,
      });
    }
  }

  return {
    grid: next,
    scoreDelta,
    moved: !gridsEqual(before, next),
    mergedCells,
    mergeEvents,
  };
}

export function tryMove(grid: Grid, dir: Direction): MoveResult {
  switch (dir) {
    case 'left':
      return moveLeft(grid);
    case 'right': {
      const flipped = flipH(grid);
      const res = moveLeft(flipped);
      res.grid = flipH(res.grid);
      res.mergeEvents = remapMerge(res.mergeEvents, (r, c) => ({
        row: r,
        col: SIZE - 1 - c,
      }));
      res.mergedCells = res.mergedCells.map((m) => ({
        row: m.row,
        col: SIZE - 1 - m.col,
      }));
      return res;
    }
    case 'up': {
      const t = transpose(grid);
      const res = moveLeft(t);
      res.grid = transpose(res.grid);
      res.mergeEvents = remapMerge(res.mergeEvents, (r, c) => ({
        row: c,
        col: r,
      }));
      res.mergedCells = res.mergedCells.map((m) => ({
        row: m.col,
        col: m.row,
      }));
      return res;
    }
    case 'down':
      return moveDown(grid);
    default:
      return {
        grid: cloneGrid(grid),
        scoreDelta: 0,
        moved: false,
        mergedCells: [],
        mergeEvents: [],
      };
  }
}

export function spawnTile(
  grid: Grid,
  rand: () => number = Math.random,
  nextId: () => string = () => crypto.randomUUID(),
): Grid {
  const empty: { r: number; c: number }[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === null) empty.push({ r, c });
    }
  }
  if (empty.length === 0) return cloneGrid(grid);
  const pick = empty[Math.floor(rand() * empty.length)]!;
  const next = cloneGrid(grid);
  next[pick.r][pick.c] = {
    id: nextId(),
    value: rand() < PROB_TWO ? 2 : 4,
  };
  return next;
}

export function canMove(grid: Grid): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === null) return true;
      const v = grid[r][c]!.value;
      if (c < SIZE - 1 && grid[r][c + 1]?.value === v) return true;
      if (r < SIZE - 1 && grid[r + 1][c]?.value === v) return true;
    }
  }
  return false;
}

export function isGameOver(grid: Grid): boolean {
  return !canMove(grid);
}

export function hasWon(grid: Grid, target = 2048): boolean {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] && grid[r][c]!.value >= target) return true;
    }
  }
  return false;
}

/** New game: two tiles on empty grid. */
export function createInitialGrid(
  rand: () => number = Math.random,
  nextId: () => string = () => crypto.randomUUID(),
): Grid {
  let g = createEmptyGrid();
  g = spawnTile(g, rand, nextId);
  g = spawnTile(g, rand, nextId);
  return g;
}
