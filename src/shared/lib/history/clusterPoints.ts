/** Groups points (pixels) whose chains of neighbours are closer than `linkPx` (single linkage). */
export function clusterPoints(
  pts: readonly { x: number; y: number }[],
  linkPx: number,
): number[][] {
  const parent = pts.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      if (Math.hypot(pts[i]!.x - pts[j]!.x, pts[i]!.y - pts[j]!.y) <= linkPx)
        parent[find(i)] = find(j);
  const groups = new Map<number, number[]>();
  pts.forEach((_, i) => {
    const r = find(i);
    groups.set(r, [...(groups.get(r) ?? []), i]);
  });
  return [...groups.values()];
}
