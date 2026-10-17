# Etap 0 — kryteria gotowości

Stan po zakończeniu Etapu 0 (17.10.2026). Plan budowany bez `legacy/index.html` —
założenia oznaczone **[ZAŁ]** poniżej.

| #   | Kryterium                                                                       | Status                                               | Jak sprawdzone                                                                                                                                                                       |
| --- | ------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Na telefonie (https) działają GPS, nagrywanie trasy i wznowienie po odświeżeniu | ⚠️ automatycznie ✅, na telefonie do sprawdzenia     | `tests/features/tracks/recorderFlow.test.ts` (filtr 30 m / 2 m, zapis, „odświeżenie” → nowy segment); przeglądarka z emulowanym GPS. Wymaga testu w terenie na prawdziwym telefonie. |
| 2   | Kopia ZIP z wersji 1 wczytuje się bez utraty punktów, tras i zdjęć              | ⚠️ na fixture ✅, na prawdziwej kopii do sprawdzenia | `tests/features/data/importFlow.test.ts`, `tests/lib/io/migrateV1.test.ts` na ręcznie napisanym `tests/fixtures/kopia-v1.json`. Format tras v1 to założenie.                         |
| 3   | Eksport ZIP otwiera się w QGIS, GPX bez błędów                                  | ⚠️ GPX ✅, QGIS do sprawdzenia                       | GPX z aplikacji przechodzi walidację `xmllint` względem oficjalnego `gpx.xsd` 1.1; GeoJSON ma kolejność `[lng, lat]`. Otwarcie w QGIS — ręcznie.                                     |
| 4   | Push na `main` publikuje nową wersję                                            | ✅                                                   | GitHub Actions → https://patekphilippe.github.io/treasure-finder/                                                                                                                    |
| 5   | Brak błędów w konsoli, jasny/ciemny, telefon/laptop                             | ✅ automatycznie                                     | Scenariusze w Chrome (puppeteer): dodawanie punktów, prowadzenie, trasy, warstwy, eksport/import — 0 błędów konsoli, zrzuty w obu motywach, 390 px i 1280 px.                        |

## Do sprawdzenia ręcznie

1. **Telefon, teren:** otwórz stronę, zezwól na lokalizację, włącz nagrywanie, przejdź
   kilkadziesiąt metrów, odśwież stronę → trasa ma nowy segment i nagrywa dalej.
   Na iPhonie kompas wymaga dotknięcia przycisku śledzenia (prośba o zgodę).
2. **Kopia z wersji 1:** Dane → Wczytaj plik → ZIP z wersji 1. Sprawdź liczbę punktów,
   tras i zdjęć. Jeśli coś się nie wczyta, wyślij kopię (bez prawdziwych lokalizacji)
   — parser poprawimy na jej podstawie.
3. **QGIS:** Dane → Pobierz kopię ZIP, rozpakuj, przeciągnij `punkty.geojson`,
   `trasy.geojson` i `poszukiwania.gpx` do QGIS.

## Założenia [ZAŁ]

- Filtr 30 m / 2 m dotyczy punktów zapisywanych do trasy; znacznik pozycji pokazuje każdy odczyt.
- GPS startuje przy otwarciu aplikacji.
- Prowadzenie: „na miejscu” w promieniu 5 m, rozszerzanym o dokładność GPS do 15 m.
- Import łączy dane po `id`: punkt z nowszym `updated` wygrywa, trasa z późniejszym `end`;
  trasa nagrywana na tym urządzeniu nigdy nie jest nadpisywana; importowane trasy nie są aktywne.
- Trasy z wersji 1 mają `segments` w kształcie `[lat, lng, t, acc][][]` (parser przyjmuje też
  obiekty `{lat, lng, t, acc}` i płaską listę `points`).
- Własne warstwy: klucz localStorage `mapa.customLayers` (warstwy z wersji 1 trzeba dodać ponownie).
- Kandydaci, strefy i kontekst przy imporcie: tylko nowe `id` (zasady scalania w Etapie 2).

## Poza zakresem Etapu 0

Czerwony ekran „Niewybuch”, przypomnienia prawne, strefy i alerty, mapa pokrycia (Etap 2),
tryb offline (Etap 3).
