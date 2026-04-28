import { SIZE } from './engine';
import { buildTransitions } from './animation';
import type { Grid, MergeEvent } from './types';

export interface TileVM {
  id: string;
  value: number;
  row: number;
  col: number;
}

export function flattenGrid(g: Grid): TileVM[] {
  const out: TileVM[] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = g[r][c];
      if (cell)
        out.push({ id: cell.id, value: cell.value, row: r, col: c });
    }
  }
  return out;
}

/** Where each tile id should animate to (pref-spawn snapshot). */
export function buildTargetsMap(
  before: Grid,
  afterNoSpawn: Grid,
  mergeEvents: MergeEvent[],
): Map<string, { r: number; c: number }> {
  const moves = buildTransitions(before, afterNoSpawn, mergeEvents);
  const map = new Map(moves.map((t) => [t.id, t.to]));
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = before[r][c];
      if (cell && !map.has(cell.id))
        map.set(cell.id, { r, c }); // stationary
    }
  }
  return map;
}
