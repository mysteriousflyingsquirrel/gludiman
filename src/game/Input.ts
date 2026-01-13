import { Direction } from './Types';

export class InputHandler {
  private keys: Set<string> = new Set();
  private bufferedDirection: Direction = 'NONE';

  constructor() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keys.add(e.key);
    
    // Buffer direction input
    switch (e.key) {
      case 'ArrowUp':
        this.bufferedDirection = 'UP';
        break;
      case 'ArrowDown':
        this.bufferedDirection = 'DOWN';
        break;
      case 'ArrowLeft':
        this.bufferedDirection = 'LEFT';
        break;
      case 'ArrowRight':
        this.bufferedDirection = 'RIGHT';
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key);
  }

  public isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  public getBufferedDirection(): Direction {
    return this.bufferedDirection;
  }

  public clearBufferedDirection(): void {
    this.bufferedDirection = 'NONE';
  }

  public consumeDirection(): Direction {
    const dir = this.bufferedDirection;
    this.bufferedDirection = 'NONE';
    return dir;
  }
}
