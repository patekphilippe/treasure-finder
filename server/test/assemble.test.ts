import { describe, expect, it } from 'vitest';
import { objectFromText, objectsFromMap } from '../src/pipeline/assemble';
import { localPlane, type Placement } from '../src/pipeline/georef';
import { parseMapReading, parseTextReading } from '../src/pipeline/readings';

// 1 unit of the image = 1000 m
const plane = localPlane({ lat: 50.77, lng: 15.8 });
const placement: Placement = {
  method: 'nazwy',
  toLatLng: (p) => plane.toLatLng(p.x * 1000, -p.y * 1000),
  rmsM: 30,
  uncertaintyM: 60,
};

describe('map reading → context objects', () => {
  it('joins close buildings into a settlement and keeps a lone house separate', () => {
    const reading = parseMapReading({
      summary: 'Messtischblatt Forstbauden',
      series: 'messtischblatt',
      year: 1883,
      sheetNumber: null,
      legibility: 'dobra',
      frameCorners: null,
      placeNames: [{ text: 'Forstbauden', x: 0.5, y: 0.5 }],
      objects: [
        { kind: 'budynek', label: '', x: 0.5, y: 0.5, confidence: 0.8 },
        { kind: 'budynek', label: '', x: 0.53, y: 0.5, confidence: 0.7 },
        { kind: 'budynek', label: '', x: 0.5, y: 0.55, confidence: 0.9 },
        { kind: 'budynek', label: '', x: 0.9, y: 0.9, confidence: 0.6 },
        { kind: 'mlyn', label: 'Mühle', x: 0.2, y: 0.3, confidence: 0.9 },
        { kind: 'smok', label: '', x: 2, y: 0.3, confidence: 0.9 },
      ],
    });
    const objects = objectsFromMap(reading, placement);
    const settlement = objects.find((o) => o.kind === 'osada')!;
    expect(settlement.label).toBe('Zabudowa: 3 budynków');
    expect(settlement.confidence).toBe(0.7);
    expect(objects.find((o) => o.label === 'Pojedynczy budynek')?.kind).toBe('inne');
    const mill = objects.find((o) => o.kind === 'mlyn')!;
    expect(mill.label).toBe('Młyn: „Mühle”');
    expect(mill.reasons[1]).toContain('nazw miejscowości');
    // the object outside the image is dropped
    expect(objects).toHaveLength(3);
  });
});

describe('text reading → context objects', () => {
  it('puts a mill 300 m north of the church, with an honest radius', () => {
    const [item] = parseTextReading({
      summary: 'Kronika parafii',
      objects: [
        {
          kind: 'mlyn',
          label: 'młyn wodny 300 kroków na północ od kościoła',
          anchor: 'kościół w Kowarach',
          anchorKind: 'kosciol',
          direction: 'N',
          distanceM: 300,
          confidence: 0.6,
        },
      ],
    }).items;
    const o = objectFromText(item!, { lat: 50.79, lng: 15.83, name: 'Kowary' });
    expect((o.lat - 50.79) * 110_574).toBeCloseTo(300, 0);
    expect(o.lng).toBeCloseTo(15.83, 6);
    expect(o.radiusM).toBe(150);
    expect(o.reasons[1]).toBe('Ok. 300 m na północ od: Kowary');
  });
});

describe('square units', () => {
  it('scales y by height ÷ width so a landscape photo keeps its shape', async () => {
    const { squareReading } = await import('../src/pipeline/readings');
    const r = parseMapReading({
      summary: '',
      series: 'messtischblatt',
      year: null,
      sheetNumber: null,
      legibility: 'dobra',
      frameCorners: null,
      placeNames: [{ text: 'Krummhübel', x: 0.5, y: 0.5 }],
      objects: [{ kind: 'mlyn', label: '', x: 0.2, y: 1, confidence: 1 }],
    });
    const sq = squareReading(r, 600 / 1500);
    expect(sq.placeNames[0]).toMatchObject({ x: 0.5, y: 0.2 });
    expect(sq.objects[0]).toMatchObject({ x: 0.2, y: 0.4 });
    expect(squareReading(r, 1)).toBe(r);
  });
});
