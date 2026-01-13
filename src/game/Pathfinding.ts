import { TilePosition, Direction } from './Types';
import { Level } from './Levels';
import { DIRECTION_VECTORS, MAZE_WIDTH, MAZE_HEIGHT } from './Constants';

/**
 * Calculate BFS distance from start to target on the grid
 * Returns -1 if target is unreachable
 */
export function bfsDistance(
  start: TilePosition,
  target: TilePosition,
  level: Level,
  isGhost: boolean = false,
  isEaten: boolean = false
): number {
  const visited: boolean[][] = [];
  for (let i = 0; i < MAZE_HEIGHT; i++) {
    visited[i] = new Array(MAZE_WIDTH).fill(false);
  }

  const queue: Array<{ pos: TilePosition; dist: number }> = [{ pos: start, dist: 0 }];
  visited[start.row][start.col] = true;

  while (queue.length > 0) {
    const { pos, dist } = queue.shift()!;

    if (pos.row === target.row && pos.col === target.col) {
      return dist;
    }

    // Check all 4 directions
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    for (const dir of directions) {
      const vec = DIRECTION_VECTORS[dir];
      const newRow = pos.row + vec.y;
      const newCol = pos.col + vec.x;

      if (newRow >= 0 && newRow < MAZE_HEIGHT && newCol >= 0 && newCol < MAZE_WIDTH) {
        if (!visited[newRow][newCol] && level.canPass(newRow, newCol, isGhost, isEaten)) {
          visited[newRow][newCol] = true;
          queue.push({ pos: { row: newRow, col: newCol }, dist: dist + 1 });
        }
      }
    }
  }

  return -1; // Unreachable
}

/**
 * Get the best direction to move towards a target
 * Returns the direction that minimizes distance to target
 */
export function getBestDirection(
  current: TilePosition,
  target: TilePosition,
  level: Level,
  currentDir: Direction,
  isGhost: boolean = false,
  isEaten: boolean = false,
  allowReverse: boolean = false
): Direction {
  let bestDir: Direction = 'NONE';
  let minDist = Infinity;

  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  
  for (const dir of directions) {
    // Don't allow immediate reversal unless specified
    if (!allowReverse && isOppositeDirection(dir, currentDir)) {
      continue;
    }

    const vec = DIRECTION_VECTORS[dir];
    const newRow = current.row + vec.y;
    const newCol = current.col + vec.x;

    if (level.canPass(newRow, newCol, isGhost, isEaten)) {
      const dist = bfsDistance({ row: newRow, col: newCol }, target, level, isGhost, isEaten);
      if (dist >= 0 && dist < minDist) {
        minDist = dist;
        bestDir = dir;
      }
    }
  }

  // If no valid direction found, allow reverse as fallback
  if (bestDir === 'NONE' && !allowReverse) {
    return getBestDirection(current, target, level, currentDir, isGhost, isEaten, true);
  }

  return bestDir;
}

/**
 * Check if two directions are opposite
 */
export function isOppositeDirection(dir1: Direction, dir2: Direction): boolean {
  if (dir1 === 'NONE' || dir2 === 'NONE') return false;
  return (
    (dir1 === 'UP' && dir2 === 'DOWN') ||
    (dir1 === 'DOWN' && dir2 === 'UP') ||
    (dir1 === 'LEFT' && dir2 === 'RIGHT') ||
    (dir1 === 'RIGHT' && dir2 === 'LEFT')
  );
}

/**
 * Get a random valid direction (for frightened mode)
 */
export function getRandomDirection(
  current: TilePosition,
  level: Level,
  currentDir: Direction,
  isGhost: boolean = false,
  isEaten: boolean = false
): Direction {
  const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const validDirs = directions.filter(dir => {
    if (isOppositeDirection(dir, currentDir)) return false;
    const vec = DIRECTION_VECTORS[dir];
    const newRow = current.row + vec.y;
    const newCol = current.col + vec.x;
    return level.canPass(newRow, newCol, isGhost, isEaten);
  });

  if (validDirs.length === 0) {
    // If no valid direction, allow reverse
    return directions.find(dir => {
      const vec = DIRECTION_VECTORS[dir];
      const newRow = current.row + vec.y;
      const newCol = current.col + vec.x;
      return level.canPass(newRow, newCol, isGhost, isEaten);
    }) || 'NONE';
  }

  return validDirs[Math.floor(Math.random() * validDirs.length)];
}
