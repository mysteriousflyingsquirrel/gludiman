import { MAZE_WIDTH, MAZE_HEIGHT } from './Constants';
import { TilePosition } from './Types';

export type TileType = 'WALL' | 'PELLET' | 'POWER_PELLET' | 'EMPTY' | 'GHOST_SPAWN' | 'PLAYER_SPAWN' | 'GATE';

export class Level {
  public tiles: TileType[][];
  public playerSpawn!: TilePosition;
  public ghostSpawn!: TilePosition;
  public pelletCount: number = 0;

  constructor(levelData: string[]) {
    this.tiles = [];
    
    for (let row = 0; row < MAZE_HEIGHT; row++) {
      this.tiles[row] = [];
      const dataRow = levelData[row] || '';
      
      for (let col = 0; col < MAZE_WIDTH; col++) {
        const char = dataRow[col] || ' ';
        let tileType: TileType;
        
        switch (char) {
          case '#':
            tileType = 'WALL';
            break;
          case '.':
            tileType = 'PELLET';
            this.pelletCount++;
            break;
          case 'o':
            tileType = 'POWER_PELLET';
            this.pelletCount++;
            break;
          case 'G':
            tileType = 'GHOST_SPAWN';
            this.ghostSpawn = { row, col };
            break;
          case 'P':
            tileType = 'PLAYER_SPAWN';
            this.playerSpawn = { row, col };
            break;
          case '=':
            tileType = 'GATE';
            break;
          default:
            tileType = 'EMPTY';
        }
        
        this.tiles[row][col] = tileType;
      }
    }
    
    // Default spawns if not specified
    if (!this.playerSpawn) {
      this.playerSpawn = { row: 23, col: 13 };
    }
    if (!this.ghostSpawn) {
      this.ghostSpawn = { row: 11, col: 13 };
    }
  }

  public getTile(row: number, col: number): TileType {
    if (row < 0 || row >= MAZE_HEIGHT || col < 0 || col >= MAZE_WIDTH) {
      return 'WALL';
    }
    return this.tiles[row][col];
  }

  public isWall(row: number, col: number): boolean {
    return this.getTile(row, col) === 'WALL';
  }

  public canPass(row: number, col: number, _isGhost: boolean, _isEaten: boolean): boolean {
    const tile = this.getTile(row, col);
    if (tile === 'WALL') return false;
    // Gates are now passable by everyone
    return true;
  }

  public removePellet(row: number, col: number): boolean {
    const tile = this.getTile(row, col);
    if (tile === 'PELLET' || tile === 'POWER_PELLET') {
      this.tiles[row][col] = 'EMPTY';
      this.pelletCount--;
      return tile === 'POWER_PELLET';
    }
    return false;
  }

  public getRemainingPellets(): number {
    return this.pelletCount;
  }
}

// Classic-style maze layout
export function createDefaultLevel(): Level {
  const levelData = [
    '############################',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#o####.#####.##.#####.####o#',
    '#.####.#####.##.#####.####.#',
    '#..........................#',
    '#.####.##.########.##.####.#',
    '#.####.##.########.##.####.#',
    '#......##....##....##......#',
    '######.##### ## #####.######',
    '     #.##### ## #####.#     ',
    '     #.##          ##.#     ',
    '     #.## ###==### ##.#     ',
    '######.## #      # ##.######',
    '      .   # GGGG #   .      ',
    '######.## #      # ##.######',
    '     #.## ######## ##.#     ',
    '     #.##          ##.#     ',
    '     #.## ######## ##.#     ',
    '######.## ######## ##.######',
    '#............##............#',
    '#.####.#####.##.#####.####.#',
    '#.####.#####.##.#####.####.#',
    '#o..##................##..o#',
    '###.##.##.########.##.##.###',
    '#......##....##....##......#',
    '#.##########.##.##########.#',
    '#.##########.##.##########.#',
    '#..........................#',
    '#o########################o#',
    '############################'
  ];
  
  // Set player spawn if not already set
  const playerRow = levelData.findIndex(row => row.includes('P'));
  if (playerRow === -1) {
    // Set player spawn at row 23, col 13 (center bottom area)
    const row = levelData[23];
    levelData[23] = row.substring(0, 13) + 'P' + row.substring(14);
  }
  
  return new Level(levelData);
}
