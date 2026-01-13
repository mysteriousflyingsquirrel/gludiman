import { Position, TilePosition, Direction, GhostState } from './Types';
import { Level } from './Levels';
import { 
  TILE_SIZE, 
  PLAYER_SPEED, 
  GHOST_SPEED, 
  FRIGHTENED_GHOST_SPEED, 
  EATEN_GHOST_SPEED,
  GHOST_HOUSE_CENTER,
  GHOST_HOUSE_EXIT,
  DIRECTION_VECTORS
} from './Constants';
import { getBestDirection, getRandomDirection } from './Pathfinding';

export class Player {
  public position: Position;
  public direction: Direction = 'NONE';
  public nextDirection: Direction = 'NONE';
  public tilePos: TilePosition;

  constructor(spawn: TilePosition) {
    this.tilePos = { ...spawn };
    this.position = {
      x: spawn.col * TILE_SIZE + TILE_SIZE / 2,
      y: spawn.row * TILE_SIZE + TILE_SIZE / 2
    };
  }

  public update(deltaTime: number, level: Level): void {
    const speed = PLAYER_SPEED * (deltaTime / 1000);
    
    // Try to turn if there's a buffered direction that's different from current
    // Allow direction changes at any time, as long as the new direction is valid
    if (this.nextDirection !== 'NONE' && this.nextDirection !== this.direction) {
      // Check if the new direction is valid
      const vec = DIRECTION_VECTORS[this.nextDirection];
      const newRow = this.tilePos.row + vec.y;
      const newCol = this.tilePos.col + vec.x;
      
      if (level.canPass(newRow, newCol, false, false)) {
        // Change direction immediately
        this.direction = this.nextDirection;
      }
    }
    
    // If nextDirection matches current direction but direction is NONE, start moving
    if (this.nextDirection !== 'NONE' && this.direction === 'NONE') {
      // Check if we can start moving in the next direction
      const vec = DIRECTION_VECTORS[this.nextDirection];
      const newRow = this.tilePos.row + vec.y;
      const newCol = this.tilePos.col + vec.x;
      if (level.canPass(newRow, newCol, false, false)) {
        this.direction = this.nextDirection;
      }
    }

    // Move in current direction
    if (this.direction !== 'NONE') {
      const vec = DIRECTION_VECTORS[this.direction];
      const newX = this.position.x + vec.x * speed;
      const newY = this.position.y + vec.y * speed;

      // Check if we can move in this direction
      const newTile = this.getTileFromPosition(newX, newY);
      if (level.canPass(newTile.row, newTile.col, false, false)) {
        this.position.x = newX;
        this.position.y = newY;
        this.tilePos = newTile;

        // Align to center of channel based on movement direction
        // When moving horizontally, keep Y centered on tile row
        // When moving vertically, keep X centered on tile column
        if (this.direction === 'LEFT' || this.direction === 'RIGHT') {
          // Moving horizontally - align Y to tile center
          const tileCenterY = this.tilePos.row * TILE_SIZE + TILE_SIZE / 2;
          this.position.y = tileCenterY;
        } else if (this.direction === 'UP' || this.direction === 'DOWN') {
          // Moving vertically - align X to tile center
          const tileCenterX = this.tilePos.col * TILE_SIZE + TILE_SIZE / 2;
          this.position.x = tileCenterX;
        }

        // Handle tunnel wrap (left/right edges)
        if (this.position.x < -TILE_SIZE / 2) {
          this.position.x = (level.tiles[0].length - 1) * TILE_SIZE + TILE_SIZE / 2;
        } else if (this.position.x > (level.tiles[0].length - 1) * TILE_SIZE + TILE_SIZE / 2) {
          this.position.x = -TILE_SIZE / 2;
        }
      } else {
        // Stop if we hit a wall
        this.direction = 'NONE';
      }
    }

    // Snap to tile center for easier turning (only when not moving)
    this.snapToTileCenter();
  }

  private getTileFromPosition(x: number, y: number): TilePosition {
    return {
      row: Math.floor(y / TILE_SIZE),
      col: Math.floor(x / TILE_SIZE)
    };
  }

  private snapToTileCenter(): void {
    // Only snap if we're not moving (direction is NONE)
    // When stopped, snap to exact center
    if (this.direction === 'NONE') {
      const tileCenterX = this.tilePos.col * TILE_SIZE + TILE_SIZE / 2;
      const tileCenterY = this.tilePos.row * TILE_SIZE + TILE_SIZE / 2;
      
      // Snap to exact center when stopped
      this.position.x = tileCenterX;
      this.position.y = tileCenterY;
    }
  }

  public reset(spawn: TilePosition): void {
    this.tilePos = { ...spawn };
    this.position = {
      x: spawn.col * TILE_SIZE + TILE_SIZE / 2,
      y: spawn.row * TILE_SIZE + TILE_SIZE / 2
    };
    this.direction = 'NONE';
    this.nextDirection = 'NONE';
  }
}

export class Ghost {
  public position: Position;
  public direction: Direction = 'UP';
  public tilePos: TilePosition;
  public state: GhostState = 'SCATTER';
  public personalityIndex: number;
  public name: string;
  public color: string;
  public scatterTarget: TilePosition;
  public isInHouse: boolean = true;
  public frightenedTimer: number = 0;
  public eatenScoreMultiplier: number = 1;
  public releaseTimer: number = 0;

  constructor(spawn: TilePosition, personalityIndex: number, name: string, color: string, scatterTarget: TilePosition) {
    this.personalityIndex = personalityIndex;
    this.name = name;
    this.color = color;
    this.scatterTarget = scatterTarget;
    this.tilePos = { ...spawn };
    this.position = {
      x: spawn.col * TILE_SIZE + TILE_SIZE / 2,
      y: spawn.row * TILE_SIZE + TILE_SIZE / 2
    };
  }

  public update(
    deltaTime: number,
    level: Level,
    player: Player,
    ghosts: Ghost[],
    mode: 'SCATTER' | 'CHASE',
    _modeTimer: number
  ): void {
    // Update state based on mode and timer
    if (this.state === 'EATEN') {
      // Continue as eaten
    } else if (this.frightenedTimer > 0) {
      this.frightenedTimer -= deltaTime;
      if (this.frightenedTimer <= 0) {
        this.state = mode;
        this.frightenedTimer = 0;
      } else {
        this.state = 'FRIGHTENED';
      }
    } else {
      this.state = mode;
    }

    // Handle eaten state - return to house
    if (this.state === 'EATEN') {
      if (this.tilePos.row === GHOST_HOUSE_CENTER.row && this.tilePos.col === GHOST_HOUSE_CENTER.col) {
        // Reached house, respawn
        this.isInHouse = true;
        this.state = mode;
        this.eatenScoreMultiplier = 1;
      } else {
        // Move towards house
        this.moveTowardsTarget(deltaTime, level, GHOST_HOUSE_CENTER, true);
        return;
      }
    }

    // Handle house exit - only if release timer has elapsed
    if (this.isInHouse && this.state !== 'EATEN' as GhostState) {
      // Count down release timer
      if (this.releaseTimer > 0) {
        this.releaseTimer -= deltaTime;
        // Don't move while waiting to be released
        return;
      }
      
      // Move towards exit
      if (this.tilePos.row === GHOST_HOUSE_EXIT.row && this.tilePos.col === GHOST_HOUSE_EXIT.col) {
        this.isInHouse = false;
      } else {
        this.moveTowardsTarget(deltaTime, level, GHOST_HOUSE_EXIT, true);
        return;
      }
    }

    // Determine target based on state
    let target: TilePosition;
    if (this.state === 'FRIGHTENED') {
      // Random movement - target is random nearby tile
      target = this.getRandomTarget();
    } else if (this.state === 'SCATTER') {
      target = this.scatterTarget;
    } else {
      // CHASE - use personality-based targeting
      target = this.getChaseTarget(player, ghosts, level);
    }

    this.moveTowardsTarget(deltaTime, level, target, false);
  }

  private getChaseTarget(player: Player, ghosts: Ghost[], _level: Level): TilePosition {
    const playerTile = player.tilePos;
    const playerDir = player.direction;

    switch (this.personalityIndex) {
      case 0: // Blip - direct chase
        return playerTile;

      case 1: // Chomp - ambush (4 tiles ahead)
        if (playerDir !== 'NONE') {
          const vec = DIRECTION_VECTORS[playerDir];
          return {
            row: playerTile.row + vec.y * 4,
            col: playerTile.col + vec.x * 4
          };
        }
        return playerTile;

      case 2: // Zing - pincer (player + vector from another ghost)
        if (ghosts.length > 0) {
          const otherGhost = ghosts.find(g => g.personalityIndex !== this.personalityIndex);
          if (otherGhost) {
            const dx = playerTile.col - otherGhost.tilePos.col;
            const dy = playerTile.row - otherGhost.tilePos.row;
            return {
              row: playerTile.row + dy,
              col: playerTile.col + dx
            };
          }
        }
        return playerTile;

      case 3: // Grit - distance-based (chase if far, scatter if close)
        const dist = Math.abs(playerTile.row - this.tilePos.row) + Math.abs(playerTile.col - this.tilePos.col);
        if (dist > 8) {
          return playerTile;
        } else {
          return this.scatterTarget;
        }

      default:
        return playerTile;
    }
  }

  private getRandomTarget(): TilePosition {
    // Return a random tile within bounds
    return {
      row: Math.floor(Math.random() * 31),
      col: Math.floor(Math.random() * 28)
    };
  }

  private moveTowardsTarget(
    deltaTime: number,
    level: Level,
    target: TilePosition,
    allowReverse: boolean
  ): void {
    const isEaten = this.state === 'EATEN';
    let speed: number;
    
    if (isEaten) {
      speed = EATEN_GHOST_SPEED;
    } else if (this.state === 'FRIGHTENED') {
      speed = FRIGHTENED_GHOST_SPEED;
    } else {
      speed = GHOST_SPEED;
    }

    speed = speed * (deltaTime / 1000);

    // Check if we're at an intersection (close to tile center)
    const tileCenterX = this.tilePos.col * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterY = this.tilePos.row * TILE_SIZE + TILE_SIZE / 2;
    const distToCenter = Math.abs(this.position.x - tileCenterX) + Math.abs(this.position.y - tileCenterY);

    if (distToCenter < TILE_SIZE * 0.2) {
      // At intersection, choose best direction
      if (this.state === 'FRIGHTENED') {
        this.direction = getRandomDirection(this.tilePos, level, this.direction, true, isEaten);
      } else {
        this.direction = getBestDirection(this.tilePos, target, level, this.direction, true, isEaten, allowReverse);
      }
    }

    // Move in current direction
    if (this.direction !== 'NONE') {
      const vec = DIRECTION_VECTORS[this.direction];
      const newX = this.position.x + vec.x * speed;
      const newY = this.position.y + vec.y * speed;

      const newTile = this.getTileFromPosition(newX, newY);
      if (level.canPass(newTile.row, newTile.col, true, isEaten)) {
        this.position.x = newX;
        this.position.y = newY;
        this.tilePos = newTile;

        // Align to center of channel based on movement direction (like player)
        if (this.direction === 'LEFT' || this.direction === 'RIGHT') {
          // Moving horizontally - align Y to tile center
          const tileCenterY = this.tilePos.row * TILE_SIZE + TILE_SIZE / 2;
          this.position.y = tileCenterY;
        } else if (this.direction === 'UP' || this.direction === 'DOWN') {
          // Moving vertically - align X to tile center
          const tileCenterX = this.tilePos.col * TILE_SIZE + TILE_SIZE / 2;
          this.position.x = tileCenterX;
        }

        // Handle tunnel wrap
        if (this.position.x < -TILE_SIZE / 2) {
          this.position.x = (level.tiles[0].length - 1) * TILE_SIZE + TILE_SIZE / 2;
        } else if (this.position.x > (level.tiles[0].length - 1) * TILE_SIZE + TILE_SIZE / 2) {
          this.position.x = -TILE_SIZE / 2;
        }
      } else {
        // Hit a wall, try to find a new direction
        this.direction = getBestDirection(this.tilePos, target, level, this.direction, true, isEaten, true);
      }
    }

    // Snap to tile center when not moving
    this.snapToTileCenter();
  }

  private getTileFromPosition(x: number, y: number): TilePosition {
    return {
      row: Math.floor(y / TILE_SIZE),
      col: Math.floor(x / TILE_SIZE)
    };
  }

  private snapToTileCenter(): void {
    // Only snap when not moving (direction is NONE) or when stopped
    if (this.direction === 'NONE') {
      const tileCenterX = this.tilePos.col * TILE_SIZE + TILE_SIZE / 2;
      const tileCenterY = this.tilePos.row * TILE_SIZE + TILE_SIZE / 2;
      this.position.x = tileCenterX;
      this.position.y = tileCenterY;
    }
  }

  public setFrightened(duration: number): void {
    if (this.state !== 'EATEN') {
      this.state = 'FRIGHTENED';
      this.frightenedTimer = duration;
      // Reverse direction when frightened
      const opposites: Record<Direction, Direction> = {
        'UP': 'DOWN',
        'DOWN': 'UP',
        'LEFT': 'RIGHT',
        'RIGHT': 'LEFT',
        'NONE': 'NONE'
      };
      this.direction = opposites[this.direction];
    }
  }

  public setEaten(scoreMultiplier: number): void {
    this.state = 'EATEN';
    this.frightenedTimer = 0;
    this.eatenScoreMultiplier = scoreMultiplier;
  }

  public reset(spawn: TilePosition): void {
    this.tilePos = { ...spawn };
    this.position = {
      x: spawn.col * TILE_SIZE + TILE_SIZE / 2,
      y: spawn.row * TILE_SIZE + TILE_SIZE / 2
    };
    this.direction = 'UP';
    this.state = 'SCATTER';
    this.isInHouse = true;
    this.frightenedTimer = 0;
    this.eatenScoreMultiplier = 1;
    this.releaseTimer = this.personalityIndex * 2000; // Staggered release
  }
}
