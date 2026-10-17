import type { FieldPoint } from '@/shared/types/domain';
import { photoPath } from './backup';

const HEADER = ['data', 'nazwa', 'szerokosc', 'dlugosc', 'glebokosc_cm', 'opis', 'zdjecie', 'id'];

const cell = (v: string | number | null) => {
  const s = v === null ? '' : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const localDateTime = (t: number) => {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/**
 * znaleziska.csv — finds ready to attach to the report: date, WGS84 coordinates, depth,
 * description and the photo file in the same ZIP. Semicolons and a BOM so Excel (pl) opens it.
 */
export function toFindsCsv(points: readonly FieldPoint[]): string {
  const finds = points
    .filter((p) => p.status === 'znalezisko' || p.type === 'znalezisko')
    .sort((a, b) => a.created - b.created);
  const rows = finds.map((p) => [
    localDateTime(p.created),
    p.name,
    p.lat.toFixed(6),
    p.lng.toFixed(6),
    p.depthCm,
    p.desc,
    p.photoId ? photoPath(p.photoId) : '',
    p.id,
  ]);
  return '﻿' + [HEADER, ...rows].map((r) => r.map(cell).join(';')).join('\r\n') + '\r\n';
}
