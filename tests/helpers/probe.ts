import { buildScene, sceneComponents, type Scene } from '@/shared/lib/detect/scene';
import type { Component } from '@/shared/lib/detect';
import type { Terrain } from './terrain';

/** Scene of a synthetic terrain and the component (convex or concave) containing point (x, y). */
export function probe(t: Terrain, x: number, y: number, kind: 'convex' | 'concave') {
  const s: Scene = buildScene(t.grid());
  const comps = sceneComponents(s, s[kind]);
  const idx = Math.floor(y) * s.w + Math.floor(x);
  const c = comps.find((k) => k.cells.includes(idx));
  if (!c) throw new Error(`no ${kind} component at ${x},${y}`);
  let sr = 0;
  let sc = 0;
  for (const i of c.cells) {
    sr += (i / s.w) | 0;
    sc += i % s.w;
  }
  return { s, c: c as Component, row: sr / c.cells.length, col: sc / c.cells.length };
}
