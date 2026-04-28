import { SIZE } from './engine';
import type { Grid, MergeEvent, TileTransition } from './types';

export function buildTransitions(
  before: Grid,
  after: Grid,
  mergeEvents: MergeEvent[],
): TileTransition[] {
  const removalTo = new Map<string, { r: number; c: number }>();
  for (const m of mergeEvents) {
    removalTo.set(m.removedId, { r: m.row, c: m.col });
  }

  const fromMap = new Map<string, { r: number; c: number }>();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = before[r][c];
      if (cell) fromMap.set(cell.id, { r, c });
    }
  }

  const toMap = new Map<string, { r: number; c: number }>();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = after[r][c];
      if (cell) toMap.set(cell.id, { r, c });
    }
  }

  const out: TileTransition[] = [];
  for (const [id, from] of fromMap) {
    const to = toMap.get(id) ?? removalTo.get(id);
    if (!to) continue;
    if (from.r === to.r && from.c === to.c) continue;
    out.push({ id, from, to });
  }
  return out;
}
