# Mapa poszukiwań

PWA (React 18 + TypeScript + Vite + Leaflet) do analizy NMT na laptopie
i pracy w terenie na telefonie. Pełna specyfikacja: docs/PLAN.md.
Wersja 1 do przeniesienia: legacy/index.html.

## Komendy

- npm run dev serwer deweloperski
- npm run test testy Vitest
- npm run lint ESLint (w tym reguła architektury)
- npm run build build produkcyjny, musi przejść przed każdym commitem

## Analiza NMT

Rozpoznawanie form: `src/shared/lib/detect/` (czyste funkcje, w aplikacji w Web Workerze).
Wszystkie progi w `interpretConfig.ts`; kalibracja: `npm run calibrate -- data/*.asc`,
wyniki i otwarte sprawy w `docs/KALIBRACJA.md`. Model wyniku: forma, interpretacja z pewnością
i alternatywami, priorytet, flagi (UXO, groby wojenne), powody po polsku, strefa poszukiwań.
Testy syntetyczne (12 modeli ze specyfikacji): `tests/lib/detect/interpret.test.ts`.
`qgis/` ma już tylko narzędzia do oglądania reliefu w QGIS.

## Zasady

- Interfejs po polsku. Nazwy w kodzie po angielsku, wartości typów
  i pola eksportu dokładnie jak w docs/PLAN.md.
- Bez backendu, kont i telemetrii. Dane tylko w IndexedDB.
- Algorytmy w src/shared/lib/ jako czyste funkcje z testami Vitest.
  Ciężkie obliczenia na rastrach tylko w Web Workerze.
- Import kopia.json z wersji 1 musi zawsze działać. Zmiana formatu
  eksportu tylko z migracją i podniesieniem pola wersja.
- Nigdy nie commituj data/, *.asc, *.tif, *.zip ani kafelków.
- Kandydaci z protectedLikely nie mogą zostać celem poszukiwań.
- Jeden krok planu = jeden commit. Po każdym kroku npm run test
  i npm run build.

## Architektura (feature-based)

```
src/
├─ main.tsx                 wejście, import stylów
├─ app/                     powłoka aplikacji: App, motyw MUI, układy, TopBar, SheetHost, store UI, konfiguracja docka
├─ features/<feature>/      jeden folder na funkcję produktu
│  ├─ components/           komponenty React tej funkcji
│  ├─ hooks/                hooki tej funkcji
│  ├─ store/                store Zustand tej funkcji (jeśli potrzebny)
│  ├─ config/               stałe i progi
│  ├─ utils/                pomocnicze czyste funkcje
│  ├─ workers/              Web Workery (np. analysis/workers/analysis.worker.ts)
│  └─ index.ts              publiczne API funkcji — import z zewnątrz tylko przez ten plik
└─ shared/                  kod używany przez wiele funkcji
   ├─ ui/                   Dock, Sheet, Toast, StatusChips, Icon, EmptyState, glass
   ├─ lib/                  czyste algorytmy: geo/, raster/, detect/, io/
   ├─ db/                   schemat IndexedDB (idb), migracje, repozytoria
   ├─ store/                stan współdzielony: useUiStore, useFieldStore, usePointDraftStore, useMapViewStore
   └─ types/                model danych z docs/PLAN.md
tests/                      testy Vitest, struktura odpowiada src/
```

Funkcje: `map`, `gps`, `tracks`, `points`, `navigation`, `layers`, `data`, `analysis`, `zones`, `safety`,
`roughness`, `tutorial`, `offline`.

- `services/` — logika poza Reactem (np. `tracks/services/trackRecorder.ts`, import/eksport w `data/services/`).
- Stan współdzielony między funkcjami jest w `src/shared/store/`: `useUiStore` (tryb, otwarty arkusz,
  wybrany punkt/strefa), `useFieldStore` (GPS, kompas, nagrywanie, cel prowadzenia), `usePointDraftStore`,
  `useMapViewStore` (w tym fly-to z przesunięciem nad arkusz), `useCoverageStore` (szerokość pasa).
  Funkcje nie importują z `app/`. `zones` i `safety` nie importują innych funkcji (unikamy cykli).
- Przewodnik (react-joyride) jest w `features/tutorial/config/tourSteps.ts`. Kroki wskazują elementy przez
  atrybut `data-tour`; nowy element UI dostaje krok i atrybut (test sprawdza, że każdy cel istnieje).
- PWA: `vite-plugin-pwa` w `vite.config.ts` (manifest, precache całej aplikacji). Aktualizacja tylko
  po kliknięciu „Odśwież” (`offline/components/UpdatePrompt.tsx`), żeby nie przerwać nagrywania trasy.
- Komunikaty prawne są w `features/safety/config/legal.ts` — krótkie, rzeczowe, z linkiem do źródła.
- Ciężkie biblioteki (JSZip, proj4) ładujemy dynamicznie (`import()`), żeby start na telefonie był lekki.
  `src/shared/lib/geo/crs.ts` rejestruje EPSG:2180 leniwie — bez efektów ubocznych przy imporcie.
- Testy, które potrzebują DOM, mają na początku `// @vitest-environment jsdom`; reszta działa w `node`.

- **Jedna funkcja na plik komponentu.** Plik `.tsx` ma dokładnie jedną funkcję
  najwyższego poziomu: komponent. Pomocnicze funkcje idą do `utils/` lub `hooks/`
  (też po jednej na plik). Handlery wewnątrz komponentu są dozwolone. Pilnuje tego
  reguła `architecture/one-function-per-file` (eslint-rules/).
- Funkcja nie importuje wnętrza innej funkcji, tylko jej `index.ts` (wyjątek: lekkie wejście
  `features/analysis/field.ts` dla trybu Teren, żeby ekran analizy zostawał ładowany leniwie).
  `shared/` nie importuje z `features/` ani `app/`.
- Alias `@/` wskazuje na `src/`.

## UI

- MUI 9 (`@mui/material`) z własnym motywem w `src/app/theme/createAppTheme.ts`
  (jasny/ciemny wg systemu, font Inter, bez ripple, zaokrąglenia, paleta zinc + emerald).
  Nie wracaj do domyślnego wyglądu Material/Android.
- Ikony: Line Awesome przez `<Icon name="route" />` z `@/shared/ui` (nazwa bez `la-`).
  `@mui/icons-material` tylko gdy w Line Awesome nie ma odpowiedniej ikony.
- Wszystko, co leży nad mapą (dock, arkusze, panele, chipy), to pływające
  powierzchnie ze stylem `glass(theme)` z `@/shared/ui`.
- Zaokrąglenia: duże powierzchnie (panele, arkusze, dock) 16px, kafle i elementy
  wewnętrzne (Alert, karty, przyciski docka) 10–12px. Kształt pigułki tylko dla
  małych elementów (przyciski, chipy, przełączniki). Uwaga: liczba w `sx.borderRadius`
  jest mnożona przez `shape.borderRadius` (10px) — podawaj wartości w px jako string.
- Style przez `sx`. MUI 9 nie przyjmuje propsów systemowych (`alignItems` itp.)
  bezpośrednio na `Stack`/`Box` — dawaj je do `sx`. Bez plików `.css`.
