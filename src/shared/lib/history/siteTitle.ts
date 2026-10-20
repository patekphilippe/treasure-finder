import { pluralPl } from '../format';

/** "Zaginiona wieś (7 budynków)": the name of a group of lost buildings by its size. */
export function siteTitle(buildings: number): string {
  const what =
    buildings >= 6
      ? 'Zaginiona wieś'
      : buildings >= 3
        ? 'Zaginiony przysiółek'
        : 'Zaginiona zagroda';
  return `${what} (${pluralPl(buildings, 'budynek', 'budynki', 'budynków')})`;
}
