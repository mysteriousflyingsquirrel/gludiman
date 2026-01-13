import { GameState, Direction } from './Types';
import { Level, createDefaultLevel } from './Levels';
import { Player, Ghost } from './Entities';
import { InputHandler } from './Input';
import { Renderer } from './Renderer';
import { AudioManager } from './Audio';
import {
  INITIAL_LIVES,
  PELLET_SCORE,
  POWER_PELLET_SCORE,
  FRIGHTENED_DURATION,
  FRIGHTENED_GHOST_SCORES,
  MODE_DURATIONS,
  GHOST_PERSONALITIES,
  TILE_SIZE
} from './Constants';

export class Game {
  private renderer: Renderer;
  private input: InputHandler;
  private audio: AudioManager;
  private level!: Level;
  private player!: Player;
  private ghosts: Ghost[] = [];
  private state: GameState = 'TITLE';
  private score: number = 0;
  private highScore: number = 0;
  private lives: number = INITIAL_LIVES;
  private lastTime: number = 0;
  private modeIndex: number = 0;
  private modeTimer: number = 0;
  private currentMode: 'SCATTER' | 'CHASE' = 'SCATTER';
  private frightenedGhostsEaten: number = 0;
  private animationFrameId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.input = new InputHandler();
    this.audio = new AudioManager();
    
    // Load high score
    const savedHighScore = localStorage.getItem('gludiManHighScore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10);
    }

    this.initializeLevel();
    this.setupEventListeners();
  }

  private initializeLevel(): void {
    this.level = createDefaultLevel();
    this.player = new Player(this.level.playerSpawn);
    
    // Create ghosts with staggered release times
    this.ghosts = [];
    for (let i = 0; i < GHOST_PERSONALITIES.length; i++) {
      const personality = GHOST_PERSONALITIES[i];
      const ghost = new Ghost(
        this.level.ghostSpawn,
        i,
        personality.name,
        personality.color,
        personality.scatterTarget
      );
      // Stagger ghost release: 0s, 2s, 4s, 6s
      ghost.releaseTimer = i * 2000;
      this.ghosts.push(ghost);
    }

    this.modeIndex = 0;
    this.modeTimer = 0;
    this.currentMode = 'SCATTER';
    this.frightenedGhostsEaten = 0;
  }

  private setupEventListeners(): void {
    // Handle Enter key for start/restart
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (this.state === 'TITLE' || this.state === 'GAME_OVER') {
          this.startGame();
        }
      } else if (e.key === 'p' || e.key === 'P') {
        if (this.state === 'PLAYING') {
          this.state = 'PAUSED';
        } else if (this.state === 'PAUSED') {
          this.state = 'PLAYING';
        }
      }
    });
  }

  public start(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private startGame(): void {
    this.score = 0;
    this.lives = INITIAL_LIVES;
    this.initializeLevel();
    this.state = 'PLAYING';
  }

  private gameLoop = (currentTime: number = performance.now()): void => {
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
    
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Handle input
    if (this.state === 'PLAYING') {
      // Check for currently pressed arrow keys
      let pressedDir: Direction = 'NONE';
      if (this.input.isKeyPressed('ArrowUp')) {
        pressedDir = 'UP';
      } else if (this.input.isKeyPressed('ArrowDown')) {
        pressedDir = 'DOWN';
      } else if (this.input.isKeyPressed('ArrowLeft')) {
        pressedDir = 'LEFT';
      } else if (this.input.isKeyPressed('ArrowRight')) {
        pressedDir = 'RIGHT';
      }
      
      // Update player's next direction
      // If a key is pressed, set it; if no key is pressed, clear it
      this.player.nextDirection = pressedDir;
    }

    // Update game state
    if (this.state === 'PLAYING') {
      this.update(deltaTime);
    }

    // Render
    this.render();
  };

  private update(deltaTime: number): void {
    // Update mode timer
    this.modeTimer += deltaTime;
    const modeDuration = MODE_DURATIONS[this.modeIndex];
    
    if (this.modeTimer >= modeDuration) {
      this.modeTimer = 0;
      this.modeIndex = (this.modeIndex + 1) % MODE_DURATIONS.length;
      this.currentMode = this.modeIndex % 2 === 0 ? 'SCATTER' : 'CHASE';
      
      // Update ghost states (except frightened/eaten)
      for (const ghost of this.ghosts) {
        if (ghost.state !== 'FRIGHTENED' && ghost.state !== 'EATEN') {
          ghost.state = this.currentMode;
        }
      }
    }

    // Update player
    this.player.update(deltaTime, this.level);

    // Check pellet collection
    const playerTile = this.player.tilePos;
    const tileType = this.level.getTile(playerTile.row, playerTile.col);
    
    if (tileType === 'PELLET' || tileType === 'POWER_PELLET') {
      const wasPowerPellet = this.level.removePellet(playerTile.row, playerTile.col);
      
      if (wasPowerPellet) {
        this.score += POWER_PELLET_SCORE;
        this.audio.playPowerPelletSound();
        this.activateFrightenedMode();
      } else {
        this.score += PELLET_SCORE;
        this.audio.playPelletSound();
      }
    }

    // Update ghosts
    for (const ghost of this.ghosts) {
      ghost.update(deltaTime, this.level, this.player, this.ghosts, this.currentMode, this.modeTimer);
    }

    // Check collisions
    this.checkCollisions();

    // Check win condition
    if (this.level.getRemainingPellets() === 0) {
      // Level complete - restart with more points
      this.score += 1000;
      this.initializeLevel();
    }

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('gludiManHighScore', this.highScore.toString());
    }
  }

  private activateFrightenedMode(): void {
    this.frightenedGhostsEaten = 0;
    for (const ghost of this.ghosts) {
      if (ghost.state !== 'EATEN') {
        ghost.setFrightened(FRIGHTENED_DURATION);
      }
    }
  }

  private checkCollisions(): void {
    const playerX = this.player.position.x;
    const playerY = this.player.position.y;

    for (const ghost of this.ghosts) {
      const ghostX = ghost.position.x;
      const ghostY = ghost.position.y;

      // Check if on same tile or very close
      const distance = Math.sqrt(
        Math.pow(playerX - ghostX, 2) + Math.pow(playerY - ghostY, 2)
      );

      if (distance < TILE_SIZE * 0.8) {
        if (ghost.state === 'FRIGHTENED') {
          // Eat ghost
          const scoreMultiplier = Math.min(this.frightenedGhostsEaten, FRIGHTENED_GHOST_SCORES.length - 1);
          const points = FRIGHTENED_GHOST_SCORES[scoreMultiplier];
          this.score += points;
          this.frightenedGhostsEaten++;
          this.audio.playGhostEatenSound();
          ghost.setEaten(this.frightenedGhostsEaten);
        } else if (ghost.state !== 'EATEN') {
          // Player dies
          this.handlePlayerDeath();
        }
      }
    }
  }

  private handlePlayerDeath(): void {
    this.lives--;
    this.audio.playDeathSound();
    
    if (this.lives <= 0) {
      this.state = 'GAME_OVER';
    } else {
      // Reset player and ghosts
      this.player.reset(this.level.playerSpawn);
      for (const ghost of this.ghosts) {
        ghost.reset(this.level.ghostSpawn);
      }
      this.frightenedGhostsEaten = 0;
    }
  }

  private render(): void {
    this.renderer.clear();

    if (this.state === 'TITLE') {
      this.renderer.renderTitleScreen();
    } else if (this.state === 'GAME_OVER') {
      this.renderer.renderLevel(this.level);
      this.renderer.renderPlayer(this.player);
      for (const ghost of this.ghosts) {
        this.renderer.renderGhost(ghost);
      }
      this.renderer.renderUI(this.score, this.highScore, this.lives);
      this.renderer.renderGameOver(this.score, this.highScore);
    } else {
      // Playing or paused
      this.renderer.renderLevel(this.level);
      this.renderer.renderPlayer(this.player);
      for (const ghost of this.ghosts) {
        this.renderer.renderGhost(ghost);
      }
      this.renderer.renderUI(this.score, this.highScore, this.lives, this.currentMode);
      
      if (this.state === 'PAUSED') {
        this.renderer.renderPauseScreen();
      }
    }
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}
