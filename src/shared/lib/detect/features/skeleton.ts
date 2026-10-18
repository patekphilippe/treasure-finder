/** Zhang–Suen thinning of a binary mask (in place on a copy). */
export function skeletonize(mask: Uint8Array, w: number, h: number): Uint8Array {
  const m = Uint8Array.from(mask);
  const at = (x: number, y: number) => (x >= 0 && x < w && y >= 0 && y < h ? m[y * w + x]! : 0);
  let changed = true;
  while (changed) {
    changed = false;
    for (const pass of [0, 1]) {
      const del: number[] = [];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (!m[y * w + x]) continue;
          const p = [
            at(x, y - 1),
            at(x + 1, y - 1),
            at(x + 1, y),
            at(x + 1, y + 1),
            at(x, y + 1),
            at(x - 1, y + 1),
            at(x - 1, y),
            at(x - 1, y - 1),
          ];
          const b = p.reduce((a, v) => a + v, 0);
          if (b < 2 || b > 6) continue;
          let a = 0;
          for (let k = 0; k < 8; k++) if (!p[k] && p[(k + 1) % 8]) a++;
          if (a !== 1) continue;
          const [p2, , p4, , p6, , p8] = p as [
            number,
            number,
            number,
            number,
            number,
            number,
            number,
            number,
          ];
          if (pass === 0 ? p2 * p4 * p6 || p4 * p6 * p8 : p2 * p4 * p8 || p2 * p6 * p8) continue;
          del.push(y * w + x);
        }
      for (const i of del) m[i] = 0;
      if (del.length) changed = true;
    }
  }
  return m;
}

export interface SkeletonGraph {
  /** cell indices of the longest path, in order */
  path: number[];
  endpoints: number[];
  junctions: number[];
}

/** Longest path through the skeleton (double BFS), its end points and branch points. */
export function skeletonGraph(sk: Uint8Array, w: number, h: number): SkeletonGraph {
  const nbrs = (i: number) => {
    const y = (i / w) | 0;
    const x = i - y * w;
    const out: number[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < w && yy >= 0 && yy < h && sk[yy * w + xx]) out.push(yy * w + xx);
      }
    return out;
  };
  const cells: number[] = [];
  for (let i = 0; i < sk.length; i++) if (sk[i]) cells.push(i);
  if (cells.length === 0) return { path: [], endpoints: [], junctions: [] };
  const endpoints = cells.filter((i) => nbrs(i).length === 1);
  const junctions = cells.filter((i) => nbrs(i).length >= 3);
  const bfs = (start: number) => {
    const prev = new Map<number, number>([[start, -1]]);
    const queue = [start];
    let last = start;
    while (queue.length) {
      const i = queue.shift()!;
      last = i;
      for (const j of nbrs(i))
        if (!prev.has(j)) {
          prev.set(j, i);
          queue.push(j);
        }
    }
    return { last, prev };
  };
  const a = bfs(endpoints[0] ?? cells[0]!).last;
  const { last: b, prev } = bfs(a);
  const path: number[] = [];
  for (let i = b; i !== -1; i = prev.get(i)!) path.push(i);
  return { path, endpoints, junctions };
}
