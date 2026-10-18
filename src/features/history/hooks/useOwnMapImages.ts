import { useEffect, useState } from 'react';
import type { OwnMap } from '@/shared/types/domain';

const decoded = new WeakMap<Blob, Promise<ImageBitmap>>();

/** Decoded images of the visible own maps, by map id (each image decoded once). */
export function useOwnMapImages(maps: readonly OwnMap[]): Record<string, ImageBitmap> {
  const [images, setImages] = useState<Record<string, ImageBitmap>>({});

  useEffect(() => {
    let cancelled = false;
    const visible = maps.filter((m) => m.visible);
    void Promise.all(
      visible.map(async (m) => {
        let p = decoded.get(m.image);
        if (!p) {
          p = createImageBitmap(m.image);
          decoded.set(m.image, p);
        }
        return [m.id, await p] as const;
      }),
    ).then((pairs) => {
      if (!cancelled) setImages(Object.fromEntries(pairs));
    });
    return () => {
      cancelled = true;
    };
  }, [maps]);

  return images;
}
