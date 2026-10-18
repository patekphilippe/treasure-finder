# Etap 3 — kryteria gotowości

Stan po krokach 1–3 (18.10.2026).

| #   | Kryterium                                                        | Status                                               | Jak sprawdzone                                                                                                                                                                        |
| --- | ---------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | W trybie samolotowym aplikacja otwiera się z ekranu głównego     | ⚠️ w przeglądarce ✅, na telefonie do sprawdzenia    | Service worker zapisuje całą aplikację (47 plików, ok. 2 MB). W Chrome po pierwszym otwarciu: tryb offline, przeładowanie, aplikacja wstaje, działa Nowy punkt i tryb Analiza.        |
| 2   | Pobrany obszar wyświetla się offline na przybliżeniach 12–19     | ⚠️ automatycznie ✅, przybliżenia 12–19 na telefonie | `tests/features/offline/planAreaTiles.test.ts`; w Chrome obszar 120 kafelków (7,6 MB) pobrany w 4 s, po przejściu offline ortofotomapa i cieniowanie NMT widoczne na przybliżeniu 17. |
| 3   | GPS, nagrywanie trasy i dodawanie punktów działają bez internetu | ✅                                                   | Wszystko zapisuje się w IndexedDB na urządzeniu, GPS nie potrzebuje sieci.                                                                                                            |

## Do sprawdzenia ręcznie na telefonie

1. Otwórz stronę z zasięgiem i dodaj ją do ekranu głównego (Android: Chrome → Zainstaluj aplikację; iPhone: Safari → Udostępnij → Do ekranu początkowego).
2. Dane → Mapy offline → Pobierz obszar mapy. Ustaw las w ramce, zostaw Ortofotomapę i Cieniowanie NMT, Pobierz.
3. Włącz tryb samolotowy, otwórz aplikację z ikony, przewiń do obszaru i przybliżaj od 12 do 19.
4. Nagraj krótką trasę i dodaj punkt bez zasięgu.

## Warunki Geoportalu (sprawdzone 18.10.2026)

- Ortofotomapa i dane Geoportalu są „dostępne bezpłatnie i możliwe do dowolnego wykorzystania”.
- Regulamin serwisu wymaga tylko podania źródła; nie określa limitów ani zakazu zapisywania kafelków.
  Mapa pokazuje „© GUGiK”.
- Aplikacja i tak pobiera grzecznie: 4 zapytania naraz, najwyżej 3000 kafelków na obszar.
  Przy zmianie zasad: sigservicedesk@geoportal.gov.pl.

## Ograniczenia

- Limit 3000 kafelków na obszar: około 4 km² z ortofotomapą i cieniowaniem (ok. 90 MB). Większy teren pobierz w kilku obszarach.
- OpenStreetMap nie jest pobierany (zasady jego serwerów). Bez internetu przełącz podkład na Ortofotomapę.
- Własne warstwy XYZ z `{s}` w adresie nie są pobierane (losowy serwer, kafelek z pamięci by nie pasował).
- Teren nierówny i BDOT10k potrzebują sieci, poza kafelkami pobranego obszaru.
