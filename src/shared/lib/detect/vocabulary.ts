import type { FormKind, Interpretation, Priority } from '@/shared/types/domain';

/** Polish labels for the interpretation model (shared by UI, reasons and exports). */
export const INTERPRETATIONS: Record<Interpretation, { label: string; priority: Priority }> = {
  zaginiona_osada: { label: 'Zaginiona osada', priority: 'najwyzszy' },
  oboz: { label: 'Obóz', priority: 'najwyzszy' },
  ziemianka: { label: 'Ziemianka', priority: 'wysoki' },
  okop: { label: 'Okop', priority: 'wysoki' },
  stanowiska_strzeleckie: { label: 'Stanowiska strzeleckie', priority: 'sredni' },
  stanowisko_sprzetu: { label: 'Stanowisko sprzętu', priority: 'sredni' },
  leje: { label: 'Leje', priority: 'niski' },
  dawna_droga: { label: 'Dawna droga', priority: 'wysoki' },
  pola_dawne: { label: 'Dawne pola', priority: 'sredni' },
  mielerz: { label: 'Mielerz', priority: 'niski' },
  wyrobisko: { label: 'Wyrobisko', priority: 'niski' },
  row_melioracyjny_graniczny: { label: 'Rów melioracyjny lub graniczny', priority: 'niski' },
  kurhan: { label: 'Kurhan', priority: 'chroniony' },
  grodzisko_waly: { label: 'Grodzisko lub wały', priority: 'chroniony' },
  wykrot: { label: 'Wykrot', priority: 'naturalne' },
  naturalna_inna: { label: 'Forma naturalna', priority: 'naturalne' },
  nieokreslona: { label: 'Nieokreślona', priority: 'niski' },
};

export const FORMS: Record<FormKind, string> = {
  pojedynczy_dol: 'Pojedynczy dół',
  pojedynczy_kopiec: 'Pojedynczy kopiec',
  skupisko: 'Skupisko',
  linia: 'Linia',
  pierscien: 'Pierścień',
  podkowa: 'Podkowa',
  platforma: 'Platforma',
  uklad_rownolegly: 'Układ równoległy',
};

export const PRIORITIES: Record<Priority, { label: string; rank: number }> = {
  najwyzszy: { label: 'Najwyższy', rank: 4 },
  wysoki: { label: 'Wysoki', rank: 3 },
  sredni: { label: 'Średni', rank: 2 },
  niski: { label: 'Niski', rank: 1 },
  chroniony: { label: 'Chroniony', rank: 0 },
  naturalne: { label: 'Naturalne', rank: 0 },
};

const LADDER: Priority[] = ['niski', 'sredni', 'wysoki', 'najwyzszy'];

/** One step up (context ≥ 0.6); protected and natural never change. */
export function bumpPriority(p: Priority): Priority {
  const i = LADDER.indexOf(p);
  return i < 0 ? p : LADDER[Math.min(LADDER.length - 1, i + 1)]!;
}
