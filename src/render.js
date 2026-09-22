// Canvas rendering — reads game state, draws it. No mutation, no event handling.

export const COLORS = {
  wall: "#0a0c13",
  floor: "#262c40",
  amber: "#f2b344",
  mint: "#5cd6a9",
  coral: "#ef6d68",
};

function cellCenter(i, gridW, cellPx) {
  const x = i % gridW, y = Math.floor(i / gridW);
  return { x: (x + 0.5) * cellPx, y: (y + 0.5) * cellPx };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMarker(ctx, i, gridW, cellPx, color, label) {
  const p = cellCenter(i, gridW, cellPx);
  const r = cellPx * 0.3;
  ctx.fillStyle = color;
  roundRect(ctx, p.x - r, p.y - r, r * 2, r * 2, r * 0.35);
  ctx.fill();
  ctx.fillStyle = "#14161f";
  ctx.font = `600 ${Math.max(9, Math.round(cellPx * 0.32))}px Manrope, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, p.x, p.y + 1);
}

/**
 * Draw the full board: floor, walls, painted trail, start/finish markers.
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} state - { gridW, gridH, cellPx, cells, trail, checked, wrongSet, startIdx, endIdx }
 */
export function renderMaze(ctx, state) {
  const { gridW, gridH, cellPx, cells, trail, checked, wrongSet, startIdx, endIdx } = state;
  const size = cellPx * gridW;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, size, size);

  // walls
  ctx.strokeStyle = COLORS.wall;
  ctx.lineCap = "square";
  const wallW = Math.max(2, cellPx * 0.11);
  ctx.lineWidth = wallW;
  ctx.beginPath();
  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      const c = cells[y * gridW + x];
      const x0 = x * cellPx, y0 = y * cellPx, x1 = x0 + cellPx, y1 = y0 + cellPx;
      if (c.N) { ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); }
      if (c.W) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); }
      if (y === gridH - 1 && c.S) { ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); }
      if (x === gridW - 1 && c.E) { ctx.moveTo(x1, y0); ctx.lineTo(x1, y1); }
    }
  }
  ctx.stroke();
  ctx.strokeRect(wallW / 2, wallW / 2, size - wallW, size - wallW);

  // painted trail
  if (trail.length) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = cellPx * 0.38;
    for (let t = 1; t < trail.length; t++) {
      const a = cellCenter(trail[t - 1], gridW, cellPx);
      const b = cellCenter(trail[t], gridW, cellPx);
      const col = checked ? (wrongSet.has(trail[t]) ? COLORS.coral : COLORS.mint) : COLORS.amber;
      ctx.strokeStyle = col;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (const cellIdx of trail) {
      const p = cellCenter(cellIdx, gridW, cellPx);
      const col = checked ? (wrongSet.has(cellIdx) ? COLORS.coral : COLORS.mint) : COLORS.amber;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, cellPx * 0.19, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawMarker(ctx, startIdx, gridW, cellPx, COLORS.amber, "S");
  drawMarker(ctx, endIdx, gridW, cellPx, COLORS.mint, "F");
}
