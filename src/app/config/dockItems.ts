import type { DockItem } from '@/shared/ui';
import type { SheetId } from '../store/useUiStore';

export const DOCK_ITEMS: readonly DockItem<SheetId>[] = [
  { id: 'tracks', icon: 'route', label: 'Trasa' },
  { id: 'points', icon: 'list-ul', label: 'Lista' },
  { id: 'addPoint', icon: 'map-marker-alt', label: 'Punkt', primary: true },
  { id: 'layers', icon: 'layer-group', label: 'Warstwy' },
  { id: 'data', icon: 'exchange-alt', label: 'Dane' },
];
