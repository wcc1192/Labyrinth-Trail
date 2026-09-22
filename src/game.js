// Game state and rules: painting a trail, checking it against the true path,
// detecting completion. No DOM or canvas code lives here.

import { generateMaze, findPath, connected } from "./maze.js";

function fmtTime(ms) {
  let s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  s = s % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function bestKey(gridW, gridH) {
  return `labyrinth-trail-best-${gridW}x${gridH}`;
}

function loadBest(gridW, gridH) {
  try {
    const v = localStorage.getItem(bestKey(gridW, gridH));
    return v ? parseInt(v, 10) : null;
  } catch {
    return null;
  }
}

function saveBest(gridW, gridH, ms) {
  try {
    localStorage.setItem(bestKey(gridW, gridH), String(ms));
  } catch {
    // best-effort only — ignore storage errors (private browsing, quota, etc.)
  }
}

export class MazeGame {
  /**
   * @param {object} opts
   * @param {(reason: string) => void} opts.onChange - called whenever state changes and the UI should re-render
   * @param {(result: {elapsedMs: number, moves: number, isNewBest: boolean, best: number}) => void} opts.onFinish
   */
  constructor({ onChange, onFinish }) {
    this.onChange = onChange || (() => {});
    this.onFinish = onFinish || (() => {});
    this._timerHandle = null;
  }

  newMaze(gridW, gridH) {
    this.gridW = gridW;
    this.gridH = gridH;
    this.cells = generateMaze(gridW, gridH);
    this.correctPath = findPath(this.cells, gridW, gridH);
    this.correctSet = new Set(this.correctPath);
    this.startIdx = 0;
    this.endIdx = gridW * gridH - 1;
    this.trail = [];
    this.checked = false;
    this.wrongSet = new Set();
    this.finished = false;
    this.elapsedMs = 0;
    this._startTime = null;
    this._stopTimer();
    this.onChange("new-maze");
  }

  get moves() {
    return Math.max(0, this.trail.length - 1);
  }

  bestTime() {
    return loadBest(this.gridW, this.gridH);
  }

  fmtTime(ms) {
    return fmtTime(ms);
  }

  _startTimer() {
    if (this._timerHandle) return;
    this._startTime = Date.now() - this.elapsedMs;
    this._timerHandle = setInterval(() => {
      this.elapsedMs = Date.now() - this._startTime;
      this.onChange("tick");
    }, 250);
  }

  _stopTimer() {
    if (this._timerHandle) {
      clearInterval(this._timerHandle);
      this._timerHandle = null;
    }
  }

  /** Attempt to extend, backtrack, or start the trail at `cellIndex`. */
  addToTrail(cellIndex) {
    if (this.finished) return;
    if (cellIndex < 0 || cellIndex >= this.gridW * this.gridH) return;

    if (this.trail.length === 0) {
      if (cellIndex === this.startIdx) {
        this.trail.push(cellIndex);
        this.checked = false;
        this._startTimer();
        this.onChange("trail-start");
      }
      return;
    }

    const last = this.trail[this.trail.length - 1];
    if (cellIndex === last) return;

    // backtrack: stepping onto the previous cell erases the last one
    if (this.trail.length >= 2 && cellIndex === this.trail[this.trail.length - 2]) {
      this.trail.pop();
      this.checked = false;
      this.onChange("trail-backtrack");
      return;
    }

    if (this.trail.includes(cellIndex)) return; // ignore jumps into the middle of the trail

    if (connected(this.cells, this.gridW, last, cellIndex)) {
      this.trail.push(cellIndex);
      this.checked = false;
      this.onChange("trail-extend");
      if (cellIndex === this.endIdx) this._attemptFinish();
    }
  }

  _evaluateTrail() {
    const wrong = new Set();
    for (const cell of this.trail) {
      if (!this.correctSet.has(cell)) wrong.add(cell);
    }
    return wrong;
  }

  /** Manual check — highlights off-path cells without needing to reach the finish. */
  checkPath() {
    if (this.trail.length === 0) {
      this.onChange("check-empty");
      return;
    }
    this.checked = true;
    this.wrongSet = this._evaluateTrail();
    this.onChange("check");
  }

  _attemptFinish() {
    this.checked = true;
    this.wrongSet = this._evaluateTrail();
    if (this.wrongSet.size === 0) {
      this._finish();
    } else {
      this.onChange("reached-end-with-errors");
    }
  }

  _finish() {
    this.finished = true;
    this._stopTimer();
    const best = this.bestTime();
    const isNewBest = !best || this.elapsedMs < best;
    if (isNewBest) saveBest(this.gridW, this.gridH, Math.round(this.elapsedMs));
    this.onFinish({
      elapsedMs: this.elapsedMs,
      moves: this.moves,
      isNewBest,
      best: this.bestTime(),
    });
    this.onChange("finished");
  }

  clearTrail() {
    if (this.finished) return;
    this.trail = [];
    this.checked = false;
    this.wrongSet = new Set();
    this._stopTimer();
    this.elapsedMs = 0;
    this.onChange("trail-cleared");
  }
}
