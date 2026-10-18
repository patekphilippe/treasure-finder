import Paper from '@mui/material/Paper';
import { glass } from '../styles/glass';
import { DockButton } from './DockButton';

export interface DockItem<Id extends string> {
  id: Id;
  /** Line Awesome icon name */
  icon: string;
  label: string;
  /** rendered as the emphasised central action */
  primary?: boolean;
}

interface DockProps<Id extends string> {
  items: readonly DockItem<Id>[];
  activeId: Id | null;
  onSelect: (id: Id) => void;
}

export function Dock<Id extends string>({ items, activeId, onSelect }: DockProps<Id>) {
  return (
    <Paper
      component="nav"
      data-tour="dock"
      sx={(theme) => ({
        ...glass(theme),
        position: 'absolute',
        zIndex: 1100,
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        width: 'min(calc(100% - 24px), 440px)',
        display: 'grid',
        gridTemplateColumns: `repeat(${items.length}, 1fr)`,
        alignItems: 'center',
        p: 0.75,
        borderRadius: '16px',
      })}
    >
      {items.map((item) => (
        <DockButton
          key={item.id}
          tourId={`dock-${item.id}`}
          icon={item.icon}
          label={item.label}
          primary={item.primary ?? false}
          active={item.id === activeId}
          onClick={() => onSelect(item.id)}
        />
      ))}
    </Paper>
  );
}
