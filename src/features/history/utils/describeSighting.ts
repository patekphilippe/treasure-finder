import { formatDate } from '@/shared/lib/format';
import { formatYears } from '@/shared/lib/history';
import type { Sighting } from '@/shared/types/domain';

const HOW: Record<Sighting['how'], string> = {
  ai: 'odczyt AI',
  reczne: 'zaznaczone ręcznie',
  zrodlo: 'analiza źródła',
  import: 'z pliku',
};

/**
 * One map an object was seen on, as two lines: the map with its years ("Messtischblatt …
 * (1883–1942)") and how and when ("odczyt AI, 20 paź 2026, 14:05").
 */
export function describeSighting(s: Sighting): { title: string; detail: string } {
  const years = s.years && formatYears(s.years);
  const title = years && !s.map.label.includes(years) ? `${s.map.label} (${years})` : s.map.label;
  const detail = [
    // "zaznaczone ręcznie" without a map is already the title
    HOW[s.how] !== title && HOW[s.how],
    s.at !== undefined && formatDate(s.at),
    s.confidence !== undefined && `pewność ${Math.round(s.confidence * 100)}%`,
  ]
    .filter(Boolean)
    .join(', ');
  return { title, detail };
}
