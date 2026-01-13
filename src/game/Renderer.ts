import { Level } from './Levels';
import { Player, Ghost } from './Entities';
import {
  TILE_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WALL_COLOR,
  PELLET_COLOR,
  POWER_PELLET_COLOR,
  PLAYER_COLOR,
  BACKGROUND_COLOR,
  TEXT_COLOR
} from './Constants';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;
  }

  public clear(): void {
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  public renderLevel(level: Level): void {
    for (let row = 0; row < level.tiles.length; row++) {
      for (let col = 0; col < level.tiles[row].length; col++) {
        const tile = level.getTile(row, col);
        const x = col * TILE_SIZE;
        const y = row * TILE_SIZE;

        switch (tile) {
          case 'WALL':
            this.drawWall(x, y);
            break;
          case 'PELLET':
            this.drawPellet(x, y);
            break;
          case 'POWER_PELLET':
            this.drawPowerPellet(x, y);
            break;
          case 'GATE':
            this.drawGate(x, y);
            break;
        }
      }
    }
  }

  private drawWall(x: number, y: number): void {
    this.ctx.fillStyle = WALL_COLOR;
    this.ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    // Add a border for depth
    this.ctx.strokeStyle = '#0000AA';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  private drawPellet(x: number, y: number): void {
    this.ctx.fillStyle = PELLET_COLOR;
    this.ctx.beginPath();
    this.ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawPowerPellet(x: number, y: number): void {
    this.ctx.fillStyle = POWER_PELLET_COLOR;
    this.ctx.beginPath();
    this.ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 6, 0, Math.PI * 2);
    this.ctx.fill();
    // Add pulsing effect (simple version)
    const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    this.ctx.globalAlpha = pulse;
    this.ctx.fill();
    this.ctx.globalAlpha = 1.0;
  }

  private drawGate(x: number, y: number): void {
    this.ctx.fillStyle = '#FFB8FF';
    this.ctx.fillRect(x, y + TILE_SIZE / 2 - 2, TILE_SIZE, 4);
  }

  public renderPlayer(player: Player): void {
    this.ctx.fillStyle = PLAYER_COLOR;
    this.ctx.beginPath();
    this.ctx.arc(player.position.x, player.position.y, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw mouth (simple arc based on direction)
    this.ctx.fillStyle = BACKGROUND_COLOR;
    this.ctx.beginPath();
    const mouthAngle = Math.PI / 4;
    let startAngle = 0;
    
    switch (player.direction) {
      case 'RIGHT':
        startAngle = 0;
        break;
      case 'DOWN':
        startAngle = Math.PI / 2;
        break;
      case 'LEFT':
        startAngle = Math.PI;
        break;
      case 'UP':
        startAngle = -Math.PI / 2;
        break;
      default:
        startAngle = 0;
    }

    this.ctx.arc(
      player.position.x,
      player.position.y,
      TILE_SIZE / 2 - 4,
      startAngle - mouthAngle,
      startAngle + mouthAngle
    );
    this.ctx.lineTo(player.position.x, player.position.y);
    this.ctx.fill();
  }

  public renderGhost(ghost: Ghost): void {
    let color = ghost.color;
    if (ghost.state === 'FRIGHTENED') {
      color = '#0000FF'; // Blue when frightened
    } else if (ghost.state === 'EATEN') {
      color = '#FFFFFF'; // White when eaten (just eyes)
    }

    if (ghost.state !== 'EATEN') {
      // Draw ghost body
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(ghost.position.x, ghost.position.y - 2, TILE_SIZE / 2 - 2, Math.PI, 0, false);
      this.ctx.rect(
        ghost.position.x - TILE_SIZE / 2 + 2,
        ghost.position.y - 2,
        TILE_SIZE - 4,
        TILE_SIZE / 2
      );
      this.ctx.fill();

      // Draw wavy bottom
      this.ctx.beginPath();
      this.ctx.moveTo(ghost.position.x - TILE_SIZE / 2 + 2, ghost.position.y + TILE_SIZE / 2 - 2);
      for (let i = 0; i < 3; i++) {
        const x = ghost.position.x - TILE_SIZE / 2 + 2 + (i * (TILE_SIZE - 4) / 3);
        const y = ghost.position.y + TILE_SIZE / 2 - 2 + (i % 2 === 0 ? -3 : 0);
        this.ctx.lineTo(x, y);
      }
      this.ctx.lineTo(ghost.position.x + TILE_SIZE / 2 - 2, ghost.position.y + TILE_SIZE / 2 - 2);
      this.ctx.fill();
    }

    // Draw eyes
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.beginPath();
    this.ctx.arc(ghost.position.x - 4, ghost.position.y - 4, 3, 0, Math.PI * 2);
    this.ctx.arc(ghost.position.x + 4, ghost.position.y - 4, 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Draw pupils
    this.ctx.fillStyle = '#000000';
    let pupilOffsetX = 0;
    let pupilOffsetY = 0;

    if (ghost.state !== 'FRIGHTENED' && ghost.state !== 'EATEN') {
      switch (ghost.direction) {
        case 'LEFT':
          pupilOffsetX = -1;
          break;
        case 'RIGHT':
          pupilOffsetX = 1;
          break;
        case 'UP':
          pupilOffsetY = -1;
          break;
        case 'DOWN':
          pupilOffsetY = 1;
          break;
      }
    }

    this.ctx.beginPath();
    this.ctx.arc(ghost.position.x - 4 + pupilOffsetX, ghost.position.y - 4 + pupilOffsetY, 1.5, 0, Math.PI * 2);
    this.ctx.arc(ghost.position.x + 4 + pupilOffsetX, ghost.position.y - 4 + pupilOffsetY, 1.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public renderUI(score: number, highScore: number, lives: number, mode?: string): void {
    this.ctx.fillStyle = TEXT_COLOR;
    this.ctx.font = '12px monospace';
    this.ctx.fillText(`Score: ${score}`, 10, 15);
    this.ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH - 150, 15);
    this.ctx.fillText(`Lives: ${lives}`, 10, CANVAS_HEIGHT - 10);
    
    if (mode) {
      this.ctx.fillText(`Mode: ${mode}`, CANVAS_WIDTH - 150, CANVAS_HEIGHT - 10);
    }

    // Draw lives indicator
    for (let i = 0; i < lives; i++) {
      this.ctx.fillStyle = PLAYER_COLOR;
      this.ctx.beginPath();
      this.ctx.arc(80 + i * 20, CANVAS_HEIGHT - 10, 6, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  public renderTitleScreen(): void {
    this.clear();
    this.ctx.fillStyle = TEXT_COLOR;
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GLUDI-MAN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    this.ctx.font = '20px monospace';
    this.ctx.fillText('Press ENTER to Start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    this.ctx.font = '14px monospace';
    this.ctx.fillText('Arrow Keys: Move | P: Pause', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    
    this.ctx.textAlign = 'left';
  }

  public renderGameOver(score: number, highScore: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.ctx.fillStyle = TEXT_COLOR;
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    this.ctx.font = '20px monospace';
    this.ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.ctx.fillText(`High Score: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
    this.ctx.font = '16px monospace';
    this.ctx.fillText('Press ENTER to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
    
    this.ctx.textAlign = 'left';
  }

  public renderPauseScreen(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.ctx.fillStyle = TEXT_COLOR;
    this.ctx.font = 'bold 36px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.ctx.textAlign = 'left';
  }
}
