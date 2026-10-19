import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

/** Object URLs of a submission's photos (fetched with the panel token), freed on unmount. */
export function useAdminImages(fileIds: readonly string[]): string[] {
  const [urls, setUrls] = useState<string[]>([]);
  const key = fileIds.join(',');
  useEffect(() => {
    let alive = true;
    const made: string[] = [];
    Promise.all(key ? key.split(',').map((id) => adminApi.file(id).catch(() => '')) : []).then(
      (list) => {
        made.push(...list.filter(Boolean));
        if (alive) setUrls(made);
        else made.forEach((u) => URL.revokeObjectURL(u));
      },
    );
    return () => {
      alive = false;
      made.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [key]);
  return urls;
}
