// DOM wiring: canvas sizing, pointer input, buttons, and reading MazeGame
// state back out into the page. All game rules live in game.js; all drawing
// lives in render.js.

import { MazeGame } from "./game.js";
import { renderMaze } from "./render.js";

const canvas = document.getElementById("maze");
const ctx = canvas.getContext("2d");
const frameInner = document.getElementById("frameInner");
const difficultySel = document.getElementById("difficulty");
const newMazeBtn = document.getElementById("newMaze");
const clearTrailBtn = document.getElementById("clearTrail");
const checkPathBtn = document.getElementById("checkPath");
const winBanner = document.getElementById("winBanner");
const playAgainBtn = document.getElementById("playAgain");
const statusEl = document.getElementById("status");
const statusText = document.getElementById("statusText");
const statTime = document.getElementById("statTime");
const statMoves = document.getElementById("statMoves");
const statWrong = document.getElementById("statWrong");
const statBest = document.getElementById("statBest");
const winTime = document.getElementById("winTime");
const winMoves = document.getElementById("winMoves");
const winBest = document.getElementById("winBest");
const winHeading = document.getElementById("winHeading");
const winSub = document.getElementById("winSub");

const dpr = Math.max(1, window.devicePixelRatio || 1);
let cellPx = 20;
let isDrawing = false;
let lastPt = null;

const game = new MazeGame({
  onChange: handleChange,
  onFinish: handleFinish,
});

function setStatus(msg, kind) {
  statusText.textContent = msg;
  statusEl.classList.remove("wrong", "ok");
  if (kind === "wrong") statusEl.classList.add("wrong");
  if (kind === "ok") statusEl.classList.add("ok");
}

function refreshStats() {
  statTime.textContent = game.fmtTime(game.elapsedMs);
  statMoves.textContent = String(game.moves);
  statWrong.textContent = game.checked ? String(game.wrongSet.size) : "–";
  statWrong.classList.toggle("warn", game.checked && game.wrongSet.size > 0);
  statWrong.classList.toggle("good", game.checked && game.wrongSet.size === 0 && game.trail.length > 0);
  const best = game.bestTime();
  statBest.textContent = best ? game.fmtTime(best) : "—";
}

function render() {
  renderMaze(ctx, {
    gridW: game.gridW,
    gridH: game.gridH,
    cellPx,
    cells: game.cells,
    trail: game.trail,
    checked: game.checked,
    wrongSet: game.wrongSet,
    startIdx: game.startIdx,
    endIdx: game.endIdx,
  });
}

function handleChange(reason) {
  refreshStats();
  render();
  switch (reason) {
    case "new-maze":
      canvas.classList.remove("finished");
      winBanner.classList.remove("show");
      setStatus("Drag from the amber square to begin.", "neutral");
      break;
    case "trail-start":
      setStatus("Tracing… follow the open corridors to the mint square.", "neutral");
      break;
    case "check-empty":
      setStatus("Paint a trail first — drag from the amber square.", "neutral");
      break;
    case "check":
      if (game.wrongSet.size === 0) {
        setStatus("Every painted cell sits on the true path. Reach the mint square to finish.", "ok");
      } else {
        setStatus(
          `${game.wrongSet.size} cell${game.wrongSet.size === 1 ? "" : "s"} painted off the true path — shown in coral. Backtrack to fix them.`,
          "wrong"
        );
      }
      break;
    case "reached-end-with-errors":
      setStatus(
        `You reached the finish, but ${game.wrongSet.size} painted cell${game.wrongSet.size === 1 ? "" : "s"} stray from the true path — shown in coral.`,
        "wrong"
      );
      break;
    case "trail-cleared":
      setStatus("Trail cleared. Drag from the amber square to begin.", "neutral");
      break;
    case "finished":
      canvas.classList.add("finished");
      setStatus("Solved — the whole trail matches the true path.", "ok");
      break;
  }
}

function handleFinish({ elapsedMs, moves, isNewBest, best }) {
  winHeading.textContent = isNewBest ? "New best time" : "Path found";
  winSub.textContent = isNewBest
    ? "Every cell you painted matched the corridor — and it is your fastest run yet."
    : "Every cell you painted matched the corridor.";
  winTime.textContent = game.fmtTime(elapsedMs);
  winMoves.textContent = String(moves);
  winBest.textContent = best ? game.fmtTime(best) : "—";
  winBanner.classList.add("show");
}

function resizeCanvas() {
  const rect = frameInner.getBoundingClientRect();
  const cssSize = Math.max(120, rect.width);
  cellPx = cssSize / game.gridW;
  canvas.width = Math.round(cssSize * dpr);
  canvas.height = Math.round(cssSize * dpr);
  canvas.style.width = `${cssSize}px`;
  canvas.style.height = `${cssSize}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function startNewMaze() {
  const size = parseInt(difficultySel.value, 10);
  game.newMaze(size, size);
  frameInner.style.animation = "none";
  void frameInner.offsetWidth;
  frameInner.style.animation = "";
  resizeCanvas();
}

// ---------- Pointer handling ----------
function pointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function processPoint(px, py) {
  const gx = Math.floor(px / cellPx);
  const gy = Math.floor(py / cellPx);
  if (gx < 0 || gy < 0 || gx >= game.gridW || gy >= game.gridH) return;
  game.addToTrail(gy * game.gridW + gx);
}

function onPointerDown(e) {
  if (game.finished) return;
  canvas.setPointerCapture?.(e.pointerId);
  isDrawing = true;
  const p = pointFromEvent(e);
  lastPt = p;
  processPoint(p.x, p.y);
  e.preventDefault();
}

function onPointerMove(e) {
  if (!isDrawing || game.finished) return;
  const p = pointFromEvent(e);
  if (lastPt) {
    const dist = Math.hypot(p.x - lastPt.x, p.y - lastPt.y);
    const steps = Math.max(1, Math.ceil(dist / (cellPx * 0.5)));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      processPoint(lastPt.x + (p.x - lastPt.x) * t, lastPt.y + (p.y - lastPt.y) * t);
    }
  } else {
    processPoint(p.x, p.y);
  }
  lastPt = p;
  e.preventDefault();
}

function onPointerUp() {
  isDrawing = false;
  lastPt = null;
}

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);

difficultySel.addEventListener("change", startNewMaze);
newMazeBtn.addEventListener("click", startNewMaze);
clearTrailBtn.addEventListener("click", () => game.clearTrail());
checkPathBtn.addEventListener("click", () => game.checkPath());
playAgainBtn.addEventListener("click", startNewMaze);

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeCanvas, 80);
});
if (window.ResizeObserver) {
  new ResizeObserver(() => resizeCanvas()).observe(frameInner);
}

startNewMaze();
