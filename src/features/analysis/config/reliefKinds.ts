import type { ReliefKind } from '@/shared/types/domain';

export const RELIEF_OPTIONS: readonly { id: ReliefKind; label: string; hint: string }[] = [
  { id: 'lrm', label: 'LRM', hint: 'Relief lokalny: niebieskie dołki, czerwone garby (±0,5 m)' },
  {
    id: 'hillshade',
    label: 'Cieniowanie',
    hint: 'Światło z 16 kierunków od strony północno-zachodniej, z arkusza w pełnej rozdzielczości',
  },
  { id: 'slope', label: 'Nachylenie', hint: 'Im ciemniej, tym stromiej (czarne od 25°)' },
];
