import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Icon } from '@/shared/ui';
import type { Proposal } from '../services/findLostBuildings';

interface ProposalItemProps {
  no: number;
  proposal: Proposal;
  onShow: () => void;
  onAccept: () => void;
  onReject: () => void;
}

export function ProposalItem({ no, proposal, onShow, onAccept, onReject }: ProposalItemProps) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, py: 0.5 }}>
      <Button
        size="small"
        onClick={onShow}
        sx={{
          minWidth: 32,
          px: 0,
          borderRadius: 999,
          bgcolor: '#7c3aed',
          color: '#fff',
          fontWeight: 700,
        }}
        aria-label={`Pokaż propozycję ${no}`}
      >
        {no}
      </Button>
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
        {proposal.title}
      </Typography>
      <Button
        size="small"
        variant="contained"
        onClick={onAccept}
        startIcon={<Icon name="check" size={16} />}
      >
        Przyjmij
      </Button>
      <Button size="small" color="inherit" onClick={onReject} aria-label="Odrzuć">
        <Icon name="times" size={16} />
      </Button>
    </Stack>
  );
}
