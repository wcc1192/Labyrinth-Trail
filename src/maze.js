// Pure maze-generation and pathfinding logic — no DOM, no canvas.
// Each cell is { N, E, S, W } booleans: true = wall present on that side.

export function idx(x, y, w) {
  return y * w + x;
}

/**
 * Randomized Prim's algorithm.
 * Produces a "perfect" maze (a spanning tree — exactly one path between any
 * two cells) but, unlike recursive backtracking, grows outward from many
 * active edges at once. That gives far more short branches and decision
 * points ("forks") instead of a few long winding corridors.
 */
export function generateMaze(w, h) {
  const cells = new Array(w * h);
  for (let i = 0; i < cells.length; i++) cells[i] = { N: true, E: true, S: true, W: true };
  const inMaze = new Array(w * h).fill(false);

  function neighborsOf(i) {
    const x = i % w, y = Math.floor(i / w);
    const res = [];
    if (y > 0) res.push({ to: i - w, dir: "N", opp: "S" });
    if (x < w - 1) res.push({ to: i + 1, dir: "E", opp: "W" });
    if (y < h - 1) res.push({ to: i + w, dir: "S", opp: "N" });
    if (x > 0) res.push({ to: i - 1, dir: "W", opp: "E" });
    return res;
  }

  const start = 0;
  inMaze[start] = true;
  const frontier = [];
  function addFrontier(cellI) {
    for (const n of neighborsOf(cellI)) {
      if (!inMaze[n.to]) frontier.push({ from: cellI, to: n.to, dir: n.dir, opp: n.opp });
    }
  }
  addFrontier(start);

  while (frontier.length) {
    const pick = Math.floor(Math.random() * frontier.length);
    const edge = frontier[pick];
    frontier.splice(pick, 1);
    if (inMaze[edge.to]) continue;
    cells[edge.from][edge.dir] = false;
    cells[edge.to][edge.opp] = false;
    inMaze[edge.to] = true;
    addFrontier(edge.to);
  }
  return cells;
}

/** Breadth-first search from cell 0 to the last cell; returns the ordered path. */
export function findPath(cells, w, h) {
  const start = 0, end = w * h - 1;
  const prev = new Array(w * h).fill(-1);
  const visited = new Array(w * h).fill(false);
  const queue = [start];
  visited[start] = true;
  while (queue.length) {
    const cur = queue.shift();
    const c = cells[cur];
    const ns = [];
    if (!c.N) ns.push(cur - w);
    if (!c.E) ns.push(cur + 1);
    if (!c.S) ns.push(cur + w);
    if (!c.W) ns.push(cur - 1);
    for (const n of ns) {
      if (!visited[n]) {
        visited[n] = true;
        prev[n] = cur;
        queue.push(n);
      }
    }
  }
  const path = [];
  let cur = end;
  while (cur !== -1) {
    path.push(cur);
    cur = prev[cur];
  }
  path.reverse();
  return path;
}

/** True if cell `a` and cell `b` are grid-adjacent with no wall between them. */
export function connected(cells, w, a, b) {
  if (b === a - w) return !cells[a].N;
  if (b === a + 1) return !cells[a].E;
  if (b === a + w) return !cells[a].S;
  if (b === a - 1) return !cells[a].W;
  return false;
}
