# Labyrinth Trail

A maze game you solve by dragging your mouse. Generate a maze, paint a trail from the start square to the finish, and check your work along the way.

## Features

- **Generated maze** — a fresh, solvable maze on every load, built with randomized Prim's algorithm (more forks and dead ends than a typical recursive-backtracker maze).
- **Mouse/touch trail** — click-and-drag (or touch-drag) from the start square to paint your route; drag back over your last cell to undo it.
- **Check path** — highlights any painted cell that has strayed from the one true route between start and finish.
- **Confirmation on completion** — reaching the finish with a clean trail triggers a win screen with your time, move count, and best-time tracking (saved per difficulty in your browser).

## Project structure

```
index.html         Page markup
src/style.css       All styling
src/maze.js         Maze generation + pathfinding (pure logic, no DOM)
src/render.js        Canvas drawing (pure, reads state, draws)
src/game.js          Game state & rules (trail painting, checking, win detection)
src/main.js          DOM wiring: canvas sizing, pointer events, buttons
```

## Running locally

```bash
npm install
npm run dev
```

Then open the printed local URL. `npm run build` produces a static `dist/` folder you can deploy anywhere (GitHub Pages, Netlify, Vercel, etc.) — it's plain HTML/CSS/JS with no backend.

## How the "one true path" check works

The maze is a *perfect maze* — a spanning tree, so there is exactly one simple path between the start and finish cells. `findPath` (breadth-first search in `maze.js`) computes that path once when the maze is generated. Checking your trail is just set membership: any painted cell not in that path is flagged. Reaching the finish with zero flagged cells is, by the uniqueness of the path, the only way to win.
