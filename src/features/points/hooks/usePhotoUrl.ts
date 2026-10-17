import { useEffect, useState } from 'react';
import { photosRepo } from '@/shared/db';

type Source = string | Blob | null;

/** Object URL for a stored photo id or a fresh Blob; revoked on change/unmount. */
export function usePhotoUrl(source: Source): string | null {
  const [loaded, setLoaded] = useState<{ source: Source; url: string } | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const blob: Promise<Blob | undefined> =
      source instanceof Blob
        ? Promise.resolve(source)
        : source
          ? photosRepo.get(source)
          : Promise.resolve(undefined);

    void blob.then((b) => {
      if (cancelled || !b) return;
      objectUrl = URL.createObjectURL(b);
      setLoaded({ source, url: objectUrl });
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  return loaded && loaded.source === source ? loaded.url : null;
}
