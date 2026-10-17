import IconButton from '@mui/material/IconButton';
import { requestCompassPermission } from '@/features/gps';
import { useFieldStore } from '@/shared/store/useFieldStore';
import { glass, Icon, useToastStore } from '@/shared/ui';

/** Floating button that toggles following the own position. */
export function FollowButton() {
  const following = useFieldStore((s) => s.following);
  const setFollowing = useFieldStore((s) => s.setFollowing);
  const position = useFieldStore((s) => s.position);
  const gpsError = useFieldStore((s) => s.gpsError);
  const showToast = useToastStore((s) => s.show);

  const onClick = async () => {
    if (following) {
      setFollowing(false);
      return;
    }
    if (gpsError) showToast(gpsError);
    else if (!position) showToast('Czekam na sygnał GPS…');
    setFollowing(true);
    await requestCompassPermission();
  };

  return (
    <IconButton
      aria-label={following ? 'Wyłącz śledzenie pozycji' : 'Śledź pozycję'}
      aria-pressed={following}
      onClick={onClick}
      sx={(theme) => ({
        ...glass(theme),
        position: 'absolute',
        zIndex: 1000,
        right: 12,
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)',
        width: 48,
        height: 48,
        borderRadius: '12px',
        color: following ? 'primary.main' : 'text.primary',
      })}
    >
      <Icon name="location-arrow" size={24} />
    </IconButton>
  );
}
