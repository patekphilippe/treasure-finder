import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Icon, useToastStore } from '@/shared/ui';
import { gmailLink } from '../utils/gmailLink';
import { inviteLink } from '../utils/inviteLink';
import { inviteMail } from '../utils/inviteMail';
import { mailtoLink } from '../utils/mailtoLink';

interface InviteAlertProps {
  name: string;
  email: string;
  onClose: () => void;
}

/** A ready invitation: the owner sends it from their own mail (Gmail or the mail app) or copies the link. */
export function InviteAlert({ name, email, onClose }: InviteAlertProps) {
  const showToast = useToastStore((s) => s.show);
  const mail = inviteMail(name, email);
  return (
    <Alert severity="success" onClose={onClose}>
      <Stack spacing={1}>
        <Typography variant="body2">
          Zaproszenie dla: <b>{name}</b> ({email}). Wyślij je ze swojej poczty. Zalogować się będzie
          można tylko kontem z tym adresem.
        </Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="contained"
            href={gmailLink(email, mail.subject, mail.body)}
            target="_blank"
            rel="noopener"
            startIcon={<Icon name="envelope" size={16} />}
          >
            Wyślij z Gmaila
          </Button>
          <Button size="small" variant="outlined" href={mailtoLink(email, mail.subject, mail.body)}>
            Program pocztowy
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={() =>
              void navigator.clipboard
                .writeText(inviteLink(email))
                .then(() => showToast('Skopiowano link'))
            }
          >
            Kopiuj link
          </Button>
        </Stack>
      </Stack>
    </Alert>
  );
}
