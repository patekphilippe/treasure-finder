/// <reference lib="webworker" />
// NMT analysis pipeline (Etap 1, part C). Everything raster-heavy runs here,
// never on the UI thread.
import type { AnalysisRequest, AnalysisResponse } from './messages';

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<AnalysisRequest>) => {
  const reply = (msg: AnalysisResponse) => self.postMessage(msg);
  if (event.data.type === 'cancel') {
    reply({ type: 'cancelled' });
    return;
  }
  reply({ type: 'error', message: 'Analiza NMT nie jest jeszcze zaimplementowana (Etap 1).' });
};
