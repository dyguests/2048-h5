import { describe, expect, it } from 'vitest';
import {
  createEmptyGrid,
  createInitialGrid,
  canMove,
  isGameOver,
  spawnTile,
  tryMove,
  SIZE,
} from './engine';
import type { Grid } from './types';

function fromRows(rows: number[][]): Grid {
  let id = 0;
  const padded: number[][] = [...rows];
  while (padded.length < SIZE) padded.push([0, 0, 0, 0]);
  return padded.slice(0, SIZE).map((row) => {
    const rr = [...row];
    while (rr.length < SIZE) rr.push(0);
    return rr.slice(0, SIZE).map((v) =>
      v === 0 ? null : { id: `t${id++}`, value: v },
    );
  });
}

describe('tryMove left', () => {
  it('merges equal adjacent tiles', () => {
    const grid: Grid = fromRows([[2, 2, 0, 0]]);
    const result = tryMove(grid, 'left');
    expect(result.moved).toBe(true);
    expect(result.grid[0][0]?.value).toBe(4);
    expect(result.grid[0].slice(1).every((c) => c === null)).toBe(true);
    expect(result.scoreDelta).toBe(4);
  });
});

describe('spawnTile and canMove', () => {
  it('spawnTile adds one tile on empty grids', () => {
    let g = createEmptyGrid();
    g = spawnTile(g, () => 0.05, () => 'nid');
    const cell = g.flat().find(Boolean)!;
    expect(g.flat().filter(Boolean)).toHaveLength(1);
    expect([2, 4]).toContain(cell.value);
  });

  it('canMove detects full board without merges', () => {
    const vals = [
      [2, 4, 8, 16],
      [32, 64, 128, 256],
      [512, 1024, 2, 4],
      [8, 16, 32, 64],
    ];
    const g = fromRows(vals);
    expect(canMove(g)).toBe(false);
    expect(isGameOver(g)).toBe(true);
  });
});

describe('directions', () => {
  it('moves up', () => {
    const grid = fromRows([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = tryMove(grid, 'up');
    expect(r.moved).toBe(true);
    expect(r.grid[0][0]?.value).toBe(4);
    expect(r.grid[1][0]).toBe(null);
  });

  it('moves down', () => {
    const grid = fromRows([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]);
    const r = tryMove(grid, 'down');
    expect(r.moved).toBe(true);
    expect(r.grid[SIZE - 1][0]?.value).toBe(4);
    expect(r.grid[SIZE - 2][0]).toBe(null);
  });
});

describe('creation', () => {
  it('createInitialGrid has two tiles', () => {
    const g = createInitialGrid(() => 0.2, () => 'x');
    expect(g.flat().filter(Boolean)).toHaveLength(2);
  });
});

describe('triple merge rule', () => {
  it('merges pairs left-to-right', () => {
    const grid = fromRows([[2, 2, 2, 0]]);
    const r = tryMove(grid, 'left');
    expect(r.grid[0][0]?.value).toBe(4);
    expect(r.grid[0][1]?.value).toBe(2);
  });
});
