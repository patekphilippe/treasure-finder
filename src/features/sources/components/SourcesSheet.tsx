import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import { Icon, Sheet } from '@/shared/ui';
import { SOURCES_ENABLED } from '../config/sourcesApi';
import { useSourcesStore } from '../store/useSourcesStore';
import { MyAnalysesList } from './MyAnalysesList';
import { SendSourceForm } from './SendSourceForm';

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
            Analiza źródeł przez AI nie jest jeszcze włączona w tej wersji aplikacji.
          </Alert>
        )}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
          <Tab value="send" label="Wyślij" />
          <Tab value="mine" label="Moje analizy" />
        </Tabs>
        {tab === 'send' ? (
          SOURCES_ENABLED && <SendSourceForm onSent={() => setTab('mine')} />
        ) : (
          <MyAnalysesList />
        )}
      </Stack>
    </Sheet>
  );
}
