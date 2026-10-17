/** Polish plural: pluralPl(1, 'punkt', 'punkty', 'punktów') → "1 punkt", 3 → "3 punkty", 5 → "5 punktów". */
export function pluralPl(n: number, one: string, few: string, many: string): string {
  const lastTwo = n % 100;
  const last = n % 10;
  let word: string;
  if (n === 1) word = one;
  else if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) word = few;
  else word = many;
  return `${n} ${word}`;
}
