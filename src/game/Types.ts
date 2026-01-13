export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'NONE';

export type GhostState = 'SCATTER' | 'CHASE' | 'FRIGHTENED' | 'EATEN';

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface Position {
  x: number;
  y: number;
}

export interface TilePosition {
  row: number;
  col: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface GhostPersonality {
  name: string;
  color: string;
  scatterTarget: TilePosition;
}
