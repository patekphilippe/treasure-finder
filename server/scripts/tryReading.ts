// One real Claude reading of a historical map with the worker's own prompt, schema, gazetteer
// and georeferencing, outside the worker. Usage (from server/):
//   ANTHROPIC_API_KEY=... npm run try-reading -- <image.png> <south,west,north,east> [model]
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { objectsFromMap } from '../src/pipeline/assemble';
import { growBbox, normalizeName } from '../src/pipeline/gazetteer';
import { placeByNames } from '../src/pipeline/georef';
import { costUsd, type PipelineModel } from '../src/pipeline/pricing';
import { MAP_SCHEMA, SYSTEM_PROMPT, mapInstruction } from '../src/pipeline/prompts';
import { parseMapReading } from '../src/pipeline/readings';

const [imagePath, bboxArg, modelArg] = process.argv.slice(2);
const [south, west, north, east] = bboxArg!.split(',').map(Number) as [
  number,
  number,
  number,
  number,
];
const view = { south, west, north, east };
const model = (modelArg ?? 'claude-haiku-5-5') as PipelineModel;
const client = new Anthropic();

const started = Date.now();
const msg = await client.messages.create({
  model,
  max_tokens: 16000,
  system: [{ type: 'text', text: SYSTEM_PROMPT }],
  output_config: { format: { type: 'json_schema', schema: MAP_SCHEMA } },
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: readFileSync(imagePath!, { encoding: 'base64' }),
          },
        },
        { type: 'text', text: mapInstruction(view) },
      ],
    },
  ],
});
const text = msg.content.find((b) => b.type === 'text');
console.log('stop', msg.stop_reason, 'seconds', ((Date.now() - started) / 1000).toFixed(1));
console.log(
  'usage',
  JSON.stringify(msg.usage),
  'cost (no batch) $',
  costUsd(model, msg.usage, false).toFixed(5),
);
const reading = parseMapReading(text && text.type === 'text' ? JSON.parse(text.text) : null);
console.log(
  'summary',
  reading.summary,
  '| series',
  reading.series,
  reading.year,
  reading.sheetNumber,
  '| legibility',
  reading.legibility,
);
console.log(
  'places',
  reading.placeNames.map((p) => `${p.text}@${p.x.toFixed(2)},${p.y.toFixed(2)}`).join('; '),
);
const counts: Record<string, number> = {};
for (const o of reading.objects) counts[o.kind] = (counts[o.kind] ?? 0) + 1;
console.log('objects', JSON.stringify(counts));
console.log(
  'named',
  reading.objects
    .filter((o) => o.kind !== 'budynek')
    .map((o) => `${o.kind}:${o.label}@${o.x.toFixed(2)},${o.y.toFixed(2)}`)
    .join('; '),
);

// gazetteer like the worker, without the D1 cache
const area = growBbox(view, 15);
const pairs = [];
for (const p of reading.placeNames.slice(0, 10)) {
  await new Promise((r) => setTimeout(r, 1100));
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: p.text,
    format: 'jsonv2',
    viewbox: [area.west, area.north, area.east, area.south].map((v) => v.toFixed(3)).join(','),
    bounded: '1',
    limit: '5',
  })}`;
  const rows = (await (
    await fetch(url, {
      headers: {
        'user-agent': 'treasure-finder/1.0 (+https://github.com/patekphilippe/treasure-finder)',
      },
    })
  ).json()) as { lat: string; lon: string; display_name: string }[];
  console.log(
    '  name',
    p.text,
    `(${normalizeName(p.text)})`,
    '→',
    rows.length,
    rows.map((r) => r.display_name.split(',')[0]).join(' / '),
  );
  if (rows.length === 1)
    pairs.push({
      uv: { x: p.x, y: p.y },
      at: { lat: Number(rows[0]!.lat), lng: Number(rows[0]!.lon), name: rows[0]!.display_name },
    });
}
const placement = placeByNames(pairs);
console.log(
  'placement',
  placement ? `${placement.method} rms ${placement.rmsM} m` : 'none',
  'from',
  pairs.length,
  'names',
);
if (placement)
  for (const o of objectsFromMap(reading, placement))
    console.log(
      '  ',
      o.kind,
      o.label,
      o.lat.toFixed(5),
      o.lng.toFixed(5),
      `±${o.radiusM}`,
      o.confidence,
    );
