import { IMAGE_EXT, WORLD_EXT } from '../config/ownMaps';

/**
 * Files of a chosen folder as maps: an image with its world file of the same name (in the same
 * subfolder) is one map, other files are left out. Sorted by name, so a folder loads in order.
 */
export function mapFileGroups<F extends { name: string; webkitRelativePath?: string }>(
  files: readonly F[],
): { name: string; files: F[] }[] {
  const groups = new Map<string, { name: string; files: F[] }>();
  for (const f of files) {
    if (!IMAGE_EXT.test(f.name) && !WORLD_EXT.test(f.name)) continue;
    const name = f.name.replace(/\.[^.]+$/, '');
    const dir = (f.webkitRelativePath ?? '').split('/').slice(0, -1).join('/');
    const key = `${dir}/${name}`;
    const g = groups.get(key) ?? { name, files: [] };
    g.files.push(f);
    groups.set(key, g);
  }
  return [...groups.values()]
    .filter((g) => g.files.some((f) => IMAGE_EXT.test(f.name)))
    .sort((a, b) => a.name.localeCompare(b.name, 'pl', { numeric: true }));
}
