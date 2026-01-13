import { Direction, GhostPersonality, TilePosition } from './Types';

export const TILE_SIZE = 20;
export const MAZE_WIDTH = 28;
export const MAZE_HEIGHT = 31;

export const CANVAS_WIDTH = MAZE_WIDTH * TILE_SIZE;
export const CANVAS_HEIGHT = MAZE_HEIGHT * TILE_SIZE;

// Movement speeds (pixels per second)
export const PLAYER_SPEED = 80;
export const GHOST_SPEED = 75;
export const FRIGHTENED_GHOST_SPEED = 50;
export const EATEN_GHOST_SPEED = 100;

// Game settings
export const INITIAL_LIVES = 3;
export const PELLET_SCORE = 10;
export const POWER_PELLET_SCORE = 50;
export const FRIGHTENED_DURATION = 6000; // milliseconds
export const FRIGHTENED_GHOST_SCORES = [200, 400, 800, 1600];

// Mode timing (milliseconds)
export const MODE_DURATIONS = [
  7000,  // SCATTER 1
  20000, // CHASE 1
  7000,  // SCATTER 2
  20000, // CHASE 2
  5000,  // SCATTER 3
  20000, // CHASE 3
  5000,  // SCATTER 4
  Infinity // CHASE 4 (forever)
];

// Ghost personalities
export const GHOST_PERSONALITIES: GhostPersonality[] = [
  { name: 'Blip', color: '#FF0000', scatterTarget: { row: 3, col: 26 } },   // Red - direct chase
  { name: 'Chomp', color: '#FFB8FF', scatterTarget: { row: 3, col: 1 } },   // Pink - ambush
  { name: 'Zing', color: '#00FFFF', scatterTarget: { row: 30, col: 26 } },  // Cyan - pincer
  { name: 'Grit', color: '#FFB851', scatterTarget: { row: 30, col: 1 } }    // Orange - distance-based
];

// Direction vectors
export const DIRECTION_VECTORS: Record<Direction, { x: number; y: number }> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  NONE: { x: 0, y: 0 }
};

// Colors
export const WALL_COLOR = '#2121DE';
export const PELLET_COLOR = '#FFB8FF';
export const POWER_PELLET_COLOR = '#FFFFFF';
export const PLAYER_COLOR = '#FFFF00';
export const BACKGROUND_COLOR = '#000000';
export const TEXT_COLOR = '#FFFFFF';

// Ghost house position
export const GHOST_HOUSE_CENTER: TilePosition = { row: 14, col: 13 };
export const GHOST_HOUSE_EXIT: TilePosition = { row: 11, col: 13 };
