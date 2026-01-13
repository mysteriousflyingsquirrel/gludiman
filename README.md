# Gludi-Man

A classic maze-chase game inspired by Pac-Man, built with TypeScript and HTML5 Canvas.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The game will open automatically in your browser at `http://localhost:3000`.

## Build

To build for production:
```bash
npm run build
```

To preview the production build:
```bash
npm run preview
```

## Controls

- **Arrow Keys**: Move Gludi-Man (UP, DOWN, LEFT, RIGHT)
  - Input buffering: Press a direction key before reaching a junction, and the turn will execute automatically when possible
- **P**: Pause/Resume game
- **Enter**: Start game (from title screen) or restart (from game over screen)

## Gameplay Rules

### Objective
Collect all pellets (small dots) and power pellets (large dots) in the maze while avoiding ghosts.

### Collectibles
- **Pellets** (small dots): Worth 10 points each
- **Power Pellets** (large dots): Worth 50 points each, and activate Frightened Mode

### Lives
- You start with 3 lives
- Lose a life when you collide with a ghost (unless the ghost is in Frightened Mode)
- Game over when all lives are lost

### Frightened Mode
- Activated when you eat a power pellet
- Lasts for 6 seconds
- Ghosts turn blue and move randomly
- You can eat frightened ghosts for points:
  - 1st ghost: 200 points
  - 2nd ghost: 400 points
  - 3rd ghost: 800 points
  - 4th ghost: 1600 points
- Eaten ghosts return to the ghost house and respawn

### Scoring
- Pellets: 10 points
- Power Pellets: 50 points
- Frightened Ghosts: 200, 400, 800, 1600 points (escalating)
- Level Complete: 1000 bonus points
- High score is saved in localStorage

### Win Condition
Collect all pellets and power pellets to complete the level. The level will restart with all pellets restored.

## Ghost Behaviors

The game features 4 unique ghosts with distinct AI personalities:

### Blip (Red)
- **Strategy**: Direct chase
- **Behavior**: Always targets your current tile
- **Scatter Target**: Top-right corner

### Chomp (Pink)
- **Strategy**: Ambush
- **Behavior**: Targets 4 tiles ahead in your current direction
- **Scatter Target**: Top-left corner

### Zing (Cyan)
- **Strategy**: Pincer movement
- **Behavior**: Calculates position based on your location and another ghost's position
- **Scatter Target**: Bottom-right corner

### Grit (Orange)
- **Strategy**: Distance-based
- **Behavior**: Chases you if far away (>8 tiles), scatters if too close
- **Scatter Target**: Bottom-left corner

### Ghost States

Ghosts alternate between two main modes:

1. **SCATTER Mode**: Each ghost targets its own corner tile
2. **CHASE Mode**: Each ghost uses its personality-based targeting

The game alternates between these modes on a timer:
- SCATTER: 7 seconds
- CHASE: 20 seconds
- SCATTER: 7 seconds
- CHASE: 20 seconds
- (continues...)

### Ghost Movement

- Ghosts use BFS (Breadth-First Search) pathfinding to find the shortest path to their target
- At intersections, ghosts choose the direction that minimizes distance to target
- Ghosts cannot immediately reverse direction (except when switching modes or in Frightened Mode)
- Ghosts can pass through gates (pink bars) that block the player

## Technical Details

- **Engine**: Custom game loop using `requestAnimationFrame`
- **Rendering**: HTML5 Canvas 2D context
- **Language**: TypeScript with strict type checking
- **Build Tool**: Vite
- **Audio**: Web Audio API for simple sound effects

## Project Structure

```
src/
  main.ts              # Bootstrap file
  game/
    Game.ts            # Main game loop and state management
    Renderer.ts        # Canvas rendering
    Input.ts           # Keyboard input handling
    Audio.ts           # Sound effects
    Levels.ts          # Level/maze layout and parsing
    Entities.ts        # Player and Ghost classes
    Pathfinding.ts     # BFS pathfinding algorithms
    Constants.ts       # Game constants and configuration
    Types.ts           # TypeScript type definitions
```

## Features

- ✅ Smooth grid-aligned movement with pixel-perfect rendering
- ✅ Input buffering for responsive controls
- ✅ 4 unique ghost AI personalities
- ✅ BFS pathfinding for intelligent ghost movement
- ✅ Frightened mode with escalating score multipliers
- ✅ Lives system with respawn mechanics
- ✅ Score tracking with localStorage persistence
- ✅ Pause functionality
- ✅ Title screen and game over screen
- ✅ Simple sound effects using Web Audio API
- ✅ Mode switching (SCATTER/CHASE) with timer system

Enjoy playing Gludi-Man!
