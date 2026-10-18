# Etap 1 — kryteria gotowości

Stan po domknięciu Etapu 1 (18.10.2026). Klasyfikację z planu zastąpił zatwierdzony model
interpretacji (forma, interpretacja z pewnością, priorytet, strefa poszukiwań), a przyjęty kandydat
trafia do trybu Teren jako strefa poszukiwań zamiast pojedynczego punktu.

| #   | Kryterium                                                                 | Status                                   | Jak sprawdzone                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Arkusz 4 × 4 km przy 1 m w mniej niż 60 s, UI nie zamarza                 | ✅                                       | W Chrome (MacBook): syntetyczny arkusz 4000 × 4000 (16 mln komórek, 112 MB .asc) w 14 s razem z BDOT10k i trzema warstwami reliefu; prawdziwy arkusz M-33-33-A-b-1-3 (2268 × 2402) w 7,9 s. Wszystko w Web Workerze, panel i mapa reagują w trakcie.                     |
| 2   | Warstwa LRM nakłada się na ortofotomapę z przesunięciem poniżej 2 m       | ✅                                       | `tests/lib/tiles/reprojectionAccuracy.test.ts`: punkty kontrolne w rogach Polski (największa zbieżność południków). Błąd poniżej pół piksela na każdym przybliżeniu; 0,11 m na 15, 0,01 m na 17, praktycznie zero na 19 (na 12 ok. 7 m, czyli 0,3 piksela, niewidoczne). |
| 3   | Na arkuszu z lasem z okopami i lejami pierwsza dwudziestka to głównie one | ⚠️ częściowo, do potwierdzenia w terenie | Runda kalibracji 1 (`docs/KALIBRACJA.md`): leje i wyrobiska wiarygodne, fałszywe okopy z 147 do 1. Otwarte: dawne pola na polach uprawnych, priorytet dawnych dróg. Brakuje wyników z terenu.                                                                            |
| 4   | Przyjęci kandydaci pojawiają się na telefonie po imporcie ZIP             | ✅                                       | Przyjęte strefy poszukiwań w trybie Teren (warstwa Strefy poszukiwań); eksport/import ZIP przenosi kandydatów z decyzjami (`tests/features/data/importFlow.test.ts`).                                                                                                    |

## Wizualizacje (kroki 2–4 planu)

- LRM w skali rozbieżnej ±0,5 m, cieniowanie z 16 kierunków (35°) i nachylenie metodą Horna,
  liczone w workerze z arkusza, zapisane jako WebP w magazynie `rasters` (offline).
- 16 kierunków rozłożonych na półokrąg wokół północnego zachodu: uśrednienie po pełnym okręgu
  znosi się do stałej (każdy stok oświetlony z przodu i z tyłu po równo).
- Duże arkusze są zmniejszane do 4096 px na bok (limit płótna na telefonach); arkusz 1 m do
  4 × 4 km zostaje w pełnej rozdzielczości.

## Ustawienia analizy

Promień LRM 5–30 m i próg 0,10–0,80 m (przy następnym wczytaniu arkusza), wagi oceny
(przeliczają oceny od razu). Domyślne wartości to skalibrowany `interpretConfig.ts`.

## Do sprawdzenia ręcznie

1. Wczytaj arkusz z lasu, przejrzyj pierwszą dwudziestkę na LRM i ortofotomapie.
2. Po wyjściu w teren oznacz wyniki (Pusto / Znalezisko / Chronione) i wczytaj ZIP z telefonu:
   zestawienie znalezisk na interpretację podpowie, które wagi zmienić w Ustawieniach analizy.
