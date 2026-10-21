/**
 * Downloads WIG sheets from a mapywig.org folder (an ordinary directory listing) to a folder on
 * disk, to be loaded in the app at once: Dane → Mapy historyczne → „Wczytaj folder”. One file at
 * a time with a pause, so the site is not flooded; files already on disk are skipped, so it can
 * be stopped and run again. Run it on your own computer (the files are not committed: data/).
 *
 *   npm run fetch-wig -- --at 50.06,19.94 --at 51.11,17.03     sheets holding these points
 *   npm run fetch-wig -- --match "krakow|tarnow|wroclaw"        file names (no Polish letters needed)
 *   npm run fetch-wig -- --sheet "P47 S40" --list               only list what would be fetched
 *   options: --url <folder> --out data/wig100 --limit 10 --delay 1500 --all (no filter)
 *            --copies (every archive's copy of a sheet, not only one per sheet and year)
 *            --verso (also the backs of the sheets)
 */
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { gridSheetAt, sheetFromName } from '../src/shared/lib/georef';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const options = (name: string) =>
  args.flatMap((a, i) => (a === name && args[i + 1] ? [args[i + 1]!] : []));
const option = (name: string, fallback: string) => options(name)[0] ?? fallback;

const START = option('--url', 'http://maps.mapywig.org/m/WIG_maps/series/100K/');
const OUT = option('--out', 'data/wig100');
const LIMIT = Number(option('--limit', 'Infinity'));
const DELAY_MS = Number(option('--delay', '1500'));
const MAX_DEPTH = 3;
const FILE = /\.(jpe?g|png|webp|tiff?|jgw|jpgw|pgw|pngw|tfw|tifw|wld|j2w)$/i;
const UA = 'treasure-finder fetch-wig (personal use, one file at a time)';

/** "P39 S24" for the 1:100 000 sheet holding a point (the grid of `gridSheetAt`). */
function wigSheetAt(lat: number, lng: number): string {
  const b = gridSheetAt(lat, lng);
  return `P${Math.round((62.25 - b.north) / 0.25)} S${Math.round((b.west - 50 / 60) / 0.5 - 8)}`;
}

/** Lower case without Polish letters, so "krakow" finds "KRAKÓW". */
const plain = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ł/gi, 'l')
    .toLowerCase();

const sheets = new Set([
  ...options('--sheet').map((s) => sheetFromName(s)?.number),
  ...options('--at').map((s) => {
    const [lat, lng] = s.split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error(`Złe --at: ${s}`);
    return wigSheetAt(lat!, lng!);
  }),
]);
sheets.delete(undefined);
const match = options('--match').map((m) => new RegExp(plain(m), 'i'));
if (!sheets.size && !match.length && !flag('--all')) {
  console.error('Podaj --at, --sheet albo --match (albo --all, żeby pobrać cały folder).');
  process.exit(1);
}
if (sheets.size) console.log(`Arkusze: ${[...sheets].join(', ')}`);

const wanted = (name: string) =>
  flag('--all') ||
  (sheets.size > 0 && sheets.has(sheetFromName(name)?.number)) ||
  match.some((m) => m.test(plain(name)));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } }).catch((e: Error) => e);
    if (r instanceof Response && r.ok) return r;
    if (attempt >= 3) throw new Error(r instanceof Response ? `HTTP ${r.status}` : r.message);
    await sleep(DELAY_MS * 2 ** attempt);
  }
}

/** Links of a directory listing under the start folder: subfolders and map files. */
function links(html: string, base: string): { dirs: string[]; files: string[] } {
  const dirs: string[] = [];
  const files: string[] = [];
  for (const [, href] of html.matchAll(/href\s*=\s*["']([^"'#?]+)["']/gi)) {
    const url = new URL(href!, base).href;
    if (!url.startsWith(START) || url === base) continue;
    if (url.endsWith('/')) dirs.push(url);
    else if (FILE.test(url)) files.push(url);
  }
  return { dirs: [...new Set(dirs)], files: [...new Set(files)] };
}

async function crawl(): Promise<string[]> {
  const found: string[] = [];
  const seen = new Set<string>();
  const queue: [string, number][] = [[START, 0]];
  while (queue.length) {
    const [url, depth] = queue.shift()!;
    if (seen.has(url)) continue;
    seen.add(url);
    const html = await (await get(url)).text();
    const { dirs, files } = links(html, url);
    found.push(...files);
    if (depth < MAX_DEPTH) queue.push(...dirs.map((d): [string, number] => [d, depth + 1]));
    if (queue.length) await sleep(DELAY_MS);
  }
  return found;
}

const fileName = (url: string) => decodeURIComponent(url.split('/').pop()!);

const base = (name: string) => name.replace(/\.[^.]+$/, '');
const IMAGE = /\.(jpe?g|png|webp|tiff?)$/i;

/**
 * One copy per sheet and year: the folder holds the same edition from several archives
 * ("…_1930.jpg", "…_1930_APP_Sygn….jpg", "…_BN_Sygn….jpg"), and each would be read by AI again.
 * The shortest name is the site's own copy. The backs ("verso") have no map. World files follow
 * their image.
 */
function oneCopyEach(urls: string[]): string[] {
  const kept = new Map<string, string>();
  for (const u of urls) {
    const name = fileName(u);
    if (!IMAGE.test(name) || (!flag('--verso') && /verso/i.test(name))) continue;
    const sheet = sheetFromName(name)?.number;
    const key = sheet && !flag('--copies') ? `${sheet}|${/1[89]\d\d/.exec(name)?.[0] ?? ''}` : name;
    const prev = kept.get(key);
    if (!prev || fileName(u).length < fileName(prev).length) kept.set(key, u);
  }
  const images = new Set([...kept.values()].map((u) => base(fileName(u))));
  return urls.filter((u) => images.has(base(fileName(u))));
}

const all = await crawl();
const matching = all.filter((u) => wanted(fileName(u)));
const picked = oneCopyEach(matching).slice(0, LIMIT);
console.log(
  `W folderze ${all.length} plików, pasuje ${matching.length}, do pobrania ${picked.length}` +
    (picked.length < matching.length ? ' (jedna kopia arkusza z roku, bez verso).' : '.'),
);
if (flag('--list')) {
  for (const u of picked) console.log(`  ${fileName(u)}  ${u}`);
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
let fetched = 0;
for (const [i, url] of picked.entries()) {
  const name = fileName(url).replace(/[\\/:*?"<>|]/g, '_');
  const path = join(OUT, name);
  if (existsSync(path)) {
    console.log(`[${i + 1}/${picked.length}] jest już: ${name}`);
    continue;
  }
  try {
    const r = await get(url);
    // a half-fetched file never looks finished: it is renamed only once complete
    await pipeline(Readable.fromWeb(r.body as never), createWriteStream(`${path}.part`));
    renameSync(`${path}.part`, path);
    fetched++;
    console.log(`[${i + 1}/${picked.length}] pobrano: ${name}`);
  } catch (e) {
    rmSync(`${path}.part`, { force: true });
    console.warn(`[${i + 1}/${picked.length}] nie udało się: ${name} (${(e as Error).message})`);
  }
  if (i < picked.length - 1) await sleep(DELAY_MS);
}
console.log(`Pobrano ${fetched} plików do ${OUT}. W aplikacji: Dane → „Wczytaj folder”.`);
