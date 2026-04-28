export type Direction = 'up' | 'down' | 'left' | 'right';

export type TileId = string;

export interface Cell {
  id: TileId;
  value: number;
}

export type Grid = (Cell | null)[][];

export interface MergeEvent {
  row: number;
  col: number;
  survivingId: TileId;
  removedId: TileId;
  value: number;
}

export interface MoveResult {
  grid: Grid;
  scoreDelta: number;
  moved: boolean;
  mergedCells: { row: number; col: number }[];
  mergeEvents: MergeEvent[];
}

export interface TileTransition {
  id: TileId;
  from: { r: number; c: number };
  to: { r: number; c: number };
}
