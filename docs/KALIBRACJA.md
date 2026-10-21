# Kalibracja interpretacji form terenu

Progi: `src/shared/lib/detect/interpretConfig.ts`. Uruchomienie na arkuszach z `data/`:

```bash
npm run calibrate -- data/*.asc            # liczby per interpretacja + 20 najlepszych z reasons
npm run calibrate -- data/*.asc --json x.json   # wszyscy kandydaci do obejrzenia
```

## Runda 1 (18.10.2026), arkusze M-33-33-A-b-1-3 (las) i M-33-33-B-d-3-1 (pola, wieś)

Przegląd: dla każdej interpretacji losowe przykłady na ortofotomapie i LRM.

| Interpretacja          | Przed | Po  | Co było źle                                  | Zmiana                                                                                                                              |
| ---------------------- | ----- | --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Okop                   | 147   | 1   | rowy przydrożne i skarpy dróg; kawałki 3–4 m | linia ≥ 15 m; okop wymaga zygzaka (sam wał po jednej stronie = rów przy drodze); BDOT10k: drogi utwardzone, kolej i wody wykluczone |
| Stanowiska strzeleckie | 74    | 2   | pojedyncze doły z pewnością 0,3              | pojedynczy dół tylko jako alternatywa (0,15); stanowiska tylko z reguły grupy                                                       |
| Stanowisko sprzętu     | 66    | 7   | nieregularne plamy                           | wał musi stać ≥ 0,2 m nad wnętrzem i mieć ≥ 0,3 m                                                                                   |
| Kurhan                 | 42    | 1   | szerokie, niskie garby w polach              | wysokość ≥ 4 % średnicy, kolistość ≥ 0,75                                                                                           |
| Grodzisko              | 10    | 1   | wydmy, narożnik pola z miedzami              | wnętrze ≥ 40 % kształtu, okrągły zarys                                                                                              |
| Zaginiona osada        | 4–8   | 0   | szum i dreny połączone w „osadę”             | dom: prostokąt 4–15 m, płaskie dno, ≥ 0,4 m; ≥ 3 domy w odstępie ≤ 40 m; piwniczki tylko ≤ 30 m od domu                             |
| Mielerz                | 24    | 2   | wydłużony nasyp przy drodze                  | kolistość ≥ 0,7                                                                                                                     |
| Leje, wyrobiska        |       |     | wyglądają wiarygodnie (doły z wałem w lesie) | bez zmian                                                                                                                           |

## Selekcja (21.10.2026)

- Kandydaci: filtr „Tylko najlepsze” włączony domyślnie (`BEST_MIN_SCORE` w
  `features/analysis/config/filters.ts`): najwyższy od oceny 30, wysoki od 35, średni od 50, niski
  tylko podniesiony przez kontekst mapy. Przyjęte, chronione i to, co wybrane ręcznie, widać zawsze.
  Progi bez sprawdzenia w terenie: do poprawy po pierwszych wynikach.
- Obiekty z map (`PROPOSAL_OPTIONS`): pewność odczytu od 0,5 (było 0,35); na mapach rzadszych niż
  4 m/piksel (1:100 000) tylko przysiółki i wsie, bez pojedynczych zagród; kościół, leśniczówka,
  kuźnia itp. tylko gdy dziś nie ma tam zabudowy (młyn, karczma, folwark i bród zawsze).
- Arkusze 1:100 000 (profil `arkusz100`, 21.10.2026, Liegnitz 422): model myli położenie znaku o ok.
  15 pikseli (120 m przy 8 m/px), więc kościoły w dzisiejszych wsiach wychodziły jako „dziś bez
  zabudowy”, a prawie każda wieś miała folwark „Gut”. Teraz budynek BDOT10k szukany co najmniej
  15 px od odczytu, wieś 40 px, i na tej skali zostaje tylko to, czego dziś nie ma.

## Otwarte

- **Dawne pola** (56): wzór równoległych garbów co 5–8 m pojawia się na dzisiejszych polach uprawnych.
  Warstwa „RTr” z WMS BDOT10k nie nadaje się jako maska pól (pokazuje tylko drobne działki).
  Do sprawdzenia w terenie albo maska pól z lokalnego BDOT10k (OT_PTTR_A).
- **Dawna droga**: wiele trafień to dzisiejsze drogi leśne we wcięciu. Często to rzeczywiście dawne
  drogi, ale priorytet „wysoki” może być za wysoki bez potwierdzenia na mapie archiwalnej.
- **Nieokreślone** (~4600 na 2 arkusze): drobne nierówności; ukryte domyślnie w filtrach.
- Potrzebne **wyniki z terenu**: zestawienie „znaleziska na interpretację” w trybie Kandydaci pokaże,
  które wagi oceny podnieść.
