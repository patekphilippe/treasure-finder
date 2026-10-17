import { pluralPl } from './pluralPl';

export const countPoints = (n: number) => pluralPl(n, 'punkt', 'punkty', 'punktów');
export const countTracks = (n: number) => pluralPl(n, 'trasa', 'trasy', 'tras');
export const countPhotos = (n: number) => pluralPl(n, 'zdjęcie', 'zdjęcia', 'zdjęć');
export const countCandidates = (n: number) => pluralPl(n, 'kandydat', 'kandydaci', 'kandydatów');
