# Etap 2 — kryteria gotowości

Stan po zakończeniu Etapu 2 (17.10.2026).

| #   | Kryterium                                                                                  | Status                                                    | Jak sprawdzone                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Po godzinnym spacerze widać luki w pokryciu, a % pokrycia strefy zgadza się z oceną na oko | ⚠️ automatycznie ✅, w terenie do sprawdzenia             | `tests/lib/geo/coveragePercent.test.ts` (pas 2 m przez kwadrat 100 m = 2 %, nakładki liczone raz); w przeglądarce 7 przejść „kosiarką” w strefie 0,91 ha → 5,6 %, zgodnie z rachunkiem 525 m² / 9 100 m².                                                                        |
| 2   | Alert strefy zakazu działa z telefonem w kieszeni (wibracja) i nie miga na granicy         | ⚠️ automatycznie ✅, wibracja do sprawdzenia na telefonie | `tests/features/zones/alerts.test.ts` — drgania wokół granicy nie przełączają stanu (histereza 5 m + ½ dokładności, maks. +10 m); w przeglądarce czerwony pasek pojawia się w strefie i znika po wyjściu. iOS Safari nie obsługuje `navigator.vibrate` — tam działa tylko pasek. |
| 3   | Statusy z telefonu wracają na laptop i widać je w liście kandydatów                        | ✅                                                        | Import ZIP scala punkty po `id` (nowszy `updated` wygrywa); lista kandydatów pokazuje „Teren: znalezisko/pusto…”, zestawienie „znaleziska na klasę”.                                                                                                                             |

## Do sprawdzenia ręcznie

1. **Strefy:** narysuj w QGIS poligon pola ze zgodą (pola: `nazwa`, `numer_zgloszenia`, `wlasciciel`, `wazna_do` w formacie RRRR-MM-DD) i poligon zakazu; zapisz jako GeoJSON w EPSG:4326; Warstwy → Strefy → Importuj.
2. **Alert:** z telefonem w kieszeni wejdź w strefę zakazu — na Androidzie poczujesz wibrację.
3. **Pokrycie:** po spacerze włącz Warstwy → Mapa pokrycia i sprawdź w szczegółach strefy procent przeszukania.

## Uwaga o iPhonie

Safari na iOS nie pozwala stronom wibrować — alert strefy na iPhonie to tylko czerwony pasek (i ekran musi być włączony; podczas nagrywania trasy aplikacja trzyma go aktywnym).
