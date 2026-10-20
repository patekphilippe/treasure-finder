import {
  countCandidates,
  countPhotos,
  countPoints,
  countTracks,
  pluralPl,
} from '@/shared/lib/format';
import type { ImportSummary } from '../services/applyImport';

/** Human summary lines, e.g. ["Nowe: 42 punkty, 3 trasy", "Zdjęcia: 17"]. */
export function describeImport(s: ImportSummary): string[] {
  const lines: string[] = [];
  const added = [
    s.pointsAdded && countPoints(s.pointsAdded),
    s.tracksAdded && countTracks(s.tracksAdded),
  ].filter(Boolean);
  const updated = [
    s.pointsUpdated && countPoints(s.pointsUpdated),
    s.tracksUpdated && countTracks(s.tracksUpdated),
  ].filter(Boolean);
  if (added.length) lines.push(`Nowe: ${added.join(', ')}`);
  if (updated.length) lines.push(`Zaktualizowane: ${updated.join(', ')}`);
  if (s.candidatesAdded || s.candidatesUpdated) {
    lines.push(
      `Kandydaci: ${countCandidates(s.candidatesAdded)} nowych, ${s.candidatesUpdated} zaktualizowanych (zobacz w trybie Analiza)`,
    );
  }
  if (s.contextAdded)
    lines.push(
      `Kontekst archiwalny: ${pluralPl(s.contextAdded, 'obiekt', 'obiekty', 'obiektów')} (użyty przy następnej analizie arkusza)`,
    );
  if (s.mapsAdded)
    lines.push(
      `Własne mapy: ${pluralPl(s.mapsAdded, 'mapa', 'mapy', 'map')} (Historia → Własne mapy)`,
    );
  if (s.waterAdded)
    lines.push(
      `Wody z BDOT10k: ${pluralPl(s.waterAdded, 'obiekt', 'obiekty', 'obiektów')} (użyte przy następnej analizie arkusza)`,
    );
  if (s.ditches)
    lines.push(
      `Pominięto ${pluralPl(s.ditches, 'rów melioracyjny', 'rowy melioracyjne', 'rowów melioracyjnych')}`,
    );
  if (s.photos) lines.push(`Wczytano ${countPhotos(s.photos)}`);
  if (s.unchanged) lines.push(`Bez zmian (już są na urządzeniu): ${s.unchanged}`);
  if (s.skipped)
    lines.push(`Pominięto ${pluralPl(s.skipped, 'rekord', 'rekordy', 'rekordów')} z błędami`);
  if (lines.length === 0) lines.push('Plik nie zawierał nowych danych');
  return lines;
}
