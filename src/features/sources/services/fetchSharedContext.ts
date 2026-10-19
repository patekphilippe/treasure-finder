import { importContextGeoJSON } from '@/shared/lib/io/importContextGeoJSON';
import type { Bounds } from '@/shared/store/useMapViewStore';
import type { ContextFeature } from '@/shared/types/domain';
import { SOURCES_API_URL } from '../config/sourcesApi';

interface PackEntry {
  key: string;
  bbox: { south: number; west: number; north: number; east: number };
  count: number;
}

const SHARED_SOURCE = 'Wspólna baza źródeł (zatwierdzone)';

/** Approved objects from the shared base for the area on screen (packs cut in 0.25° cells). */
export async function fetchSharedContext(view: Bounds): Promise<ContextFeature[]> {
  const get = async (path: string) => {
    let res: Response;
    try {
      res = await fetch(`${SOURCES_API_URL}/api/${path}`);
    } catch {
      throw new Error('Brak połączenia z serwerem analizy');
    }
    if (!res.ok) throw new Error(`Błąd serwera (${res.status})`);
    return res.json();
  };
  const index = (await get('kontekst/index.json')) as PackEntry[];
  const hits = index.filter(
    (e) =>
      e.count > 0 &&
      e.bbox.south < view.north &&
      e.bbox.north > view.south &&
      e.bbox.west < view.east &&
      e.bbox.east > view.west,
  );
  const packs = await Promise.all(hits.map((e) => get(e.key)));
  return packs.flatMap((p) => importContextGeoJSON(p, SHARED_SOURCE).context);
}
