import JSZip from 'jszip';
import { ZIP_FILES } from './backup';
import { ImportError, parseBackup, type ParsedBackup } from './parseBackup';

export interface ImportBundle extends ParsedBackup {
  /** photo id → JPEG */
  photos: Map<string, Blob>;
}

const baseName = (path: string) =>
  path
    .split('/')
    .pop()
    ?.replace(/\.[^.]+$/, '') ?? '';

/** Reads an export ZIP (this app or version 1): kopia.json plus zdjecia/<photo>.jpg. */
export async function importZip(data: Blob | ArrayBuffer | Uint8Array): Promise<ImportBundle> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data instanceof Blob ? await data.arrayBuffer() : data);
  } catch {
    throw new ImportError('Nie udało się otworzyć pliku ZIP');
  }
  const backupFile = Object.values(zip.files).find(
    (f) => !f.dir && f.name.split('/').pop() === ZIP_FILES.backup,
  );
  if (!backupFile) throw new ImportError(`W archiwum brakuje pliku ${ZIP_FILES.backup}`);

  let json: unknown;
  try {
    json = JSON.parse(await backupFile.async('string'));
  } catch {
    throw new ImportError(`Plik ${ZIP_FILES.backup} jest uszkodzony`);
  }
  const backup = parseBackup(json);

  const wanted = new Set(backup.points.flatMap((p) => (p.photoId ? [p.photoId] : [])));
  const photos = new Map<string, Blob>();
  for (const file of Object.values(zip.files)) {
    if (file.dir || !file.name.includes(ZIP_FILES.photosDir)) continue;
    const id = baseName(file.name);
    if (!wanted.has(id) || photos.has(id)) continue;
    photos.set(id, new Blob([await file.async('arraybuffer')], { type: 'image/jpeg' }));
  }
  return { ...backup, photos };
}
