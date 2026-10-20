import IconButton from '@mui/material/IconButton';
import { useMembership } from '@/shared/store/useMembership';
import { useUiStore } from '@/shared/store/useUiStore';
import { glass, Icon } from '@/shared/ui';

/** Top bar: the account sheet (who is signed in, the owner's panel, sign in and out). */
export function AccountButton() {
  const signedIn = useMembership((s) => s.email !== null);
  const goTo = useUiStore((s) => s.goTo);

  return (
    <IconButton
      data-tour="account"
      aria-label="Moje konto"
      onClick={() => goTo({ mode: 'field', sheet: 'account' })}
      sx={(theme) => ({
        ...glass(theme),
        width: 44,
        height: 44,
        borderRadius: 999,
        color: signedIn ? 'primary.main' : 'text.secondary',
      })}
    >
      <Icon name="user-circle" size={28} />
    </IconButton>
  );
}
