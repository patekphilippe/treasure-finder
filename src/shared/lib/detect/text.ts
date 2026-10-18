import { compassPl } from './geom';

/** Plain-Polish fragments for reasons (no long dashes; numbers with a decimal comma). */
export const m = (v: number, digits = 1) =>
  `${v.toLocaleString('pl-PL', { maximumFractionDigits: digits, minimumFractionDigits: 0 })} m`;
export const pct = (v: number) => `${Math.round(v * 100)}%`;
export const side = (angle: number) => `po ${compassPl(angle)} stronie`;
export const towards = (angle: number) => {
  const map: Record<string, string> = {
    wschodniej: 'wschód',
    'północno-wschodniej': 'północny wschód',
    północnej: 'północ',
    'północno-zachodniej': 'północny zachód',
    zachodniej: 'zachód',
    'południowo-zachodniej': 'południowy zachód',
    południowej: 'południe',
    'południowo-wschodniej': 'południowy wschód',
  };
  return map[compassPl(angle)]!;
};
