import Alert from '@mui/material/Alert';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { useState } from 'react';
import { AnalysisCard, Icon } from '@/shared/ui';
import { SOURCES_ENABLED, WAITING } from '../config/sourcesApi';
import { useSourcesStore } from '../store/useSourcesStore';
import { MyAnalysesList } from './MyAnalysesList';
import { SendSourceForm } from './SendSourceForm';

/**
 * Analizy: a photo of an old map, a chronicle or a memory sent to the AI analysis on the server;
 * its results are taken into the archival context here.
 */
export function SourcesCard() {
  const sent = useSourcesStore((s) => s.sent);
  const [tab, setTab] = useState<'send' | 'mine'>(sent.length ? 'mine' : 'send');
  const fresh = sent.filter((s) => s.fresh).length;
  const waiting = sent.filter((s) => !s.view || WAITING.includes(s.view.status)).length;
  const status = fresh
    ? `Nowe wyniki: ${fresh}`
    : waiting
      ? `Na serwerze: ${waiting}, wynik zwykle w ciągu godziny`
      : sent.length
        ? `Wysłanych: ${sent.length}`
        : 'Nic jeszcze nie wysłano';

  return (
    <AnalysisCard
      data-tour="analyses-sources"
      card="sources"
      icon="camera"
      title="Zdjęcie mapy lub opis (AI na serwerze)"
      needs="zdjęcie dawnej mapy, fragment kroniki albo opis, internet"
      status={status}
    >
      {!SOURCES_ENABLED && (
        <Alert severity="info" icon={<Icon name="info-circle" size={18} />}>
          Wysyłanie źródeł ruszy wkrótce. Do tego czasu oglądasz mapy historyczne w Warstwach i
          zaznaczasz obiekty ręcznie.
        </Alert>
      )}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
        <Tab value="send" label="Dodaj" />
        <Tab value="mine" label={fresh ? `Moje źródła (${fresh})` : 'Moje źródła'} />
      </Tabs>
      {tab === 'send' ? (
        <SendSourceForm disabled={!SOURCES_ENABLED} onSent={() => setTab('mine')} />
      ) : (
        <MyAnalysesList />
      )}
    </AnalysisCard>
  );
}
