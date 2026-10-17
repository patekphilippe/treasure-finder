import type { AreaCategory } from '@/shared/types/domain';

export interface AreaCategoryMeta {
  label: string;
  /** what it usually is in the field */
  hint: string;
  color: string;
  icon: string;
}

/** Order = order in the legend and the picker. The first three are suggested automatically. */
export const AREA_CATEGORIES: Record<AreaCategory, AreaCategoryMeta> = {
  skupisko: {
    label: 'Skupisko dołów',
    hint: 'leje, jamy, dawne stanowiska, wyrobiska',
    color: '#dc2626',
    icon: 'braille',
  },
  liniowe: {
    label: 'Rowy i okopy',
    hint: 'okopy, rowy, wąwozy drogowe, skarpy',
    color: '#0891b2',
    icon: 'grip-lines',
  },
  pojedyncze: {
    label: 'Pojedyncza forma',
    hint: 'pojedynczy dół, lej albo kopiec',
    color: '#2563eb',
    icon: 'dot-circle',
  },
  wyrobisko: {
    label: 'Wyrobisko',
    hint: 'żwirownia, glinianka, piaskownia',
    color: '#a16207',
    icon: 'hard-hat',
  },
  naturalne: {
    label: 'Naturalne',
    hint: 'wydmy, wąwóz, skarpa rzeczna',
    color: '#65a30d',
    icon: 'tree',
  },
  ciekawe: {
    label: 'Ciekawe',
    hint: 'warte sprawdzenia w terenie',
    color: '#7c3aed',
    icon: 'star',
  },
  nieistotne: {
    label: 'Nieistotne',
    hint: 'śmieci, hałdy, ślady maszyn',
    color: '#71717a',
    icon: 'times-circle',
  },
};

export const AREA_CATEGORY_ORDER = Object.keys(AREA_CATEGORIES) as AreaCategory[];

/** Automatic recognition from the shape of the marked place. */
export const SUGGEST = {
  /** length / width above this: linear forms */
  linearElongation: 3,
  /** smaller than this: a single form */
  singleMaxAreaM2: 1500,
};

/** A new analysis matches an existing place closer than this. */
export const SAME_PLACE_M = 40;
/** How many of the strongest areas of one analysis are kept as places. */
export const PLACES_PER_ANALYSIS = 20;
