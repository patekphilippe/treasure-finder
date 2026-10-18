/**
 * Calibration on real NMT sheets (docs/PLAN.md): runs the same interpretation as the app and
 * prints the number of candidates per interpretation and the 20 best with WGS84 coordinates
 * and reasons. Thresholds: src/shared/lib/detect/interpretConfig.ts.
 *
 *   npm run calibrate -- data/*.asc [--no-buildings] [--top 20] [--json out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { PNG } from 'pngjs';
import { analyseSheet, INTERPRETATIONS, PRIORITIES } from '../src/shared/lib/detect';
import { readAsc, readGeoTiff, type DemGrid } from '../src/shared/lib/raster';
import { applyExclusion, exclusionRequests } from '../src/shared/lib/tiles';
import type { ExclusionGroup } from '../src/shared/config/bdotWms';
import type { Candidate } from '../src/shared/types/domain';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
};
const files = args.filter(
  (a, i) => !a.startsWith('--') && !['--top', '--json'].includes(args[i - 1] ?? ''),
);
const topN = Number(option('--top', '20'));

/** Same exclusion as the app (BDOT10k WMS), decoded with pngjs because Node has no OffscreenCanvas. */
async function exclusionMask(g: DemGrid, groups?: ExclusionGroup[]): Promise<Uint8Array> {
  const ref = { originE: g.originE, originN: g.originN, res: g.cell, w: g.w, h: g.h };
  const mask = new Uint8Array(g.w * g.h);
  for (const req of exclusionRequests(ref, groups)) {
    try {
      const png = PNG.sync.read(Buffer.from(await (await fetch(req.url)).arrayBuffer()));
      applyExclusion(mask, png.data, req, ref);
    } catch (e) {
      console.warn(`  (pominięto warstwę BDOT10k: ${(e as Error).message})`);
    }
  }
  return mask;
}

const sheetId = (path: string) => {
  const base = basename(path).replace(/\.[^.]+$/, '');
  return base.match(/[MN]-\d{2}-\d{1,3}(-[A-Da-d0-9]+)*$/)?.[0] ?? base;
};

async function main() {
  if (files.length === 0) {
    console.log(
      'Użycie: npm run calibrate -- data/*.asc [--no-buildings] [--top 20] [--json wynik.json]',
    );
    process.exit(1);
  }
  const all: Candidate[] = [];
  for (const file of files) {
    const t0 = performance.now();
    const buf = readFileSync(file);
    const grid = /\.tiff?$/i.test(file)
      ? await readGeoTiff(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
      : readAsc(buf);
    const exclude = flag('--no-buildings') ? undefined : await exclusionMask(grid);
    const excluded = exclude ? exclude.reduce((a, v) => a + v, 0) / exclude.length : 0;
    const cs = analyseSheet(grid, { sheetId: sheetId(file), exclude });
    all.push(...cs);
    console.log(
      `${sheetId(file)}: ${cs.length} form, BDOT10k pominięto ${Math.round(excluded * 100)}%, ${((performance.now() - t0) / 1000).toFixed(1)} s`,
    );
  }

  console.log('\nInterpretacje:');
  const counts = new Map<string, number>();
  for (const c of all) counts.set(c.interpretation, (counts.get(c.interpretation) ?? 0) + 1);
  for (const [k, n] of [...counts].sort((a, b) => b[1] - a[1]))
    console.log(
      `  ${INTERPRETATIONS[k as keyof typeof INTERPRETATIONS].label.padEnd(32)} ${String(n).padStart(5)}`,
    );

  console.log(`\nTop ${topN} wg oceny (bez nieokreślonych i naturalnych):`);
  const best = all
    .filter((c) => c.interpretation !== 'nieokreslona' && c.priority !== 'naturalne')
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
  for (const c of best) {
    const flags = [c.flags.uxo && 'UXO', c.flags.warGraves && 'groby'].filter(Boolean).join(', ');
    console.log(
      `  ${String(c.score).padStart(3)}  ${INTERPRETATIONS[c.interpretation].label} ${Math.round(c.confidence * 100)}% · ${PRIORITIES[c.priority].label}` +
        `${flags ? ` · ${flags}` : ''}  ${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}  [${c.id}]`,
    );
    for (const r of c.reasons) console.log(`        - ${r}`);
  }
  const json = option('--json', '');
  if (json) {
    writeFileSync(json, JSON.stringify(all));
    console.log(`\nZapisano ${all.length} kandydatów do ${json}`);
  }
}

void main();
