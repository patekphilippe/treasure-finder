import { useEffect, useState } from 'react';
import type { Image2180 } from '@/features/map';
import { useReliefStore } from '../store/useReliefStore';

/** Decoded images of the chosen relief layer, one per sheet (decoded only when shown). */
export function useReliefSources(): { id: string; source: Image2180 }[] {
  const kind = useReliefStore((s) => s.kind);
  const records = useReliefStore((s) => s.records);
  const [sources, setSources] = useState<{ id: string; source: Image2180 }[]>([]);

  useEffect(() => {
    let cancelled = false;
    const chosen = records.filter(
      (r) => r.kind === kind && r.data instanceof Blob && r.res !== undefined,
    );
    void Promise.all(
      chosen.map(async (r) => ({
        id: r.id,
        source: {
          image: await createImageBitmap(r.data as Blob),
          originE: r.originE!,
          originN: r.originN!,
          res: r.res!,
        },
      })),
    ).then((list) => {
      if (!cancelled) setSources(list);
    });
    return () => {
      cancelled = true;
    };
  }, [kind, records]);

  return kind ? sources : [];
}
