import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import { Icon, Sheet } from '@/shared/ui';
import { SOURCES_ENABLED } from '../config/sourcesApi';
import { useSourcesStore } from '../store/useSourcesStore';
import { MyAnalysesList } from './MyAnalysesList';
import { SendSourceForm } from './SendSourceForm';
import { SharedContextSection } from './SharedContextSection';

interface SourcesSheetProps {
  onClose: () => void;
}

/** Send historical sources to the AI analysis and take its results into the archival context. */
export function SourcesSheet({ onClose }: SourcesSheetProps) {
  const hasSent = useSourcesStore((s) => s.sent.length > 0);
  const [tab, setTab] = useState<'send' | 'mine'>(hasSent ? 'mine' : 'send');

  return (
    <Sheet title="Źródła historyczne" onClose={onClose}>
      <Stack spacing={2}>
        {!SOURCES_ENABLED && (
          <Alert severity="info" icon={<Icon name="info-circle" size={18} />}>
            Wysyłanie źródeł ruszy wkrótce. Do tego czasu możesz oglądać mapy historyczne i
            zaznaczać obiekty ręcznie w „Własne mapy i obiekty”.
          </Alert>
        )}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab value="send" label="Dodaj" />
          <Tab value="mine" label="Moje źródła" />
        </Tabs>
        {tab === 'send' ? (
          <SendSourceForm disabled={!SOURCES_ENABLED} onSent={() => setTab('mine')} />
        ) : (
          <MyAnalysesList />
        )}
        {SOURCES_ENABLED && (
          <>
            <Divider />
            <SharedContextSection />
          </>
        )}
      </Stack>
    </Sheet>
  );
}
