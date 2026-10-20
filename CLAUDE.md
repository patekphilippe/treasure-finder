# Mapa poszukiwań

PWA (React 18 + TypeScript + Vite + Leaflet) do analizy NMT na laptopie
i pracy w terenie na telefonie. Pełna specyfikacja: docs/PLAN.md.
Wersja 1 do przeniesienia: legacy/index.html.

## Komendy

- npm run dev serwer deweloperski
- npm run test testy Vitest
- npm run lint ESLint (w tym reguła architektury)
- npm run build build produkcyjny, musi przejść przed każdym commitem
- w `server/`: npm run test (testy w runtime Workers), npm run typecheck, npm run dev (wrangler dev)

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
- Bez telemetrii. Konta tylko dla zaproszonych członków społeczności: Auth0 wyłącznie przez OAuth
  (Google), rejestracja tylko z zaproszenia na adres e-mail (docs/BACKEND.md, „Logowanie”). Reszta
  aplikacji działa bez konta i offline. Dane użytkownika tylko w IndexedDB. Jedyny backend to `server/`
  (Cloudflare Worker, docs/BACKEND.md): przyjmuje zgłoszenia źródeł i analizuje je przez AI,
  prowadzi wspólną bazę społeczności i liczy kafelki cieniowania z NMT GUGiK (R2).
  Jest opcjonalny: aplikacja działa w pełni bez niego i offline. Klucz API Anthropic tylko
  w sekretach workera, nigdy w aplikacji. Aplikacja nie importuje z `server/`; serwer może
  używać czystych funkcji z `src/shared/lib/` przez alias `@/`.
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
   ├─ ui/                   Dock, Sheet, Toast, StatusChips, Icon, EmptyState, AnalysisCard, glass
   ├─ lib/                  czyste algorytmy: geo/, raster/, detect/, io/
   ├─ db/                   schemat IndexedDB (idb), migracje, repozytoria
   ├─ store/                stan współdzielony: useUiStore, useFieldStore, usePointDraftStore, useMapViewStore, useActivityStore
   ├─ auth/                 logowanie Auth0 społeczności (leniwy klient, signIn, signOut, memberAuth)
   └─ types/                model danych z docs/PLAN.md
tests/                      testy Vitest, struktura odpowiada src/
```

Funkcje: `map`, `gps`, `tracks`, `points`, `navigation`, `layers`, `data`, `analysis`, `zones`, `safety`,
`roughness`, `tutorial`, `offline`, `account` (przycisk i arkusz konta: kto jest zalogowany, panel właściciela dla admina), `history` (obiekty z map archiwalnych, własne mapy, odczyt map przez AI, społeczność: wspólna baza członków), `sources` (zgłoszenia źródeł i analiza AI na backendzie `server/`).

- `services/` — logika poza Reactem (np. `tracks/services/trackRecorder.ts`, import/eksport w `data/services/`).
- Stan współdzielony między funkcjami jest w `src/shared/store/`: `useUiStore` (tryb, otwarty arkusz,
  wybrany punkt/strefa), `useFieldStore` (GPS, kompas, nagrywanie, cel prowadzenia), `usePointDraftStore`,
  `useMapViewStore` (w tym fly-to z przesunięciem nad arkusz), `useCoverageStore` (szerokość pasa),
  `useActivityStore` (długie zadania całej aplikacji).
  Funkcje nie importują z `app/`. `zones` i `safety` nie importują innych funkcji (unikamy cykli).
- Panele docka: **Warstwy tylko pokazują** (podkład, mapy historyczne i własne: włączanie i krycie, obiekty
  z map, wyniki analiz), **Analizy** liczą, **Dane** wczytują i zapisują (kopie, pliki GeoJSON, własne mapy
  historyczne: wczytanie, umieszczenie, rok, narożniki, usuwanie; mapy offline). Wyjątki zostawione w Warstwach:
  własne warstwy XYZ/WMS po adresie i import stref (Strefy → Zarządzaj). Komponenty `history` trafiają do
  `LayersSheet` przez sloty z `SheetHost` (layers nie importuje history).
- Analizy (`app/components/AnalysesSheet.tsx`) tylko układają karty funkcji w ramie `AnalysisCard`
  (`shared/ui`, jedna otwarta naraz: `useUiStore.analysesCard`, `showAnalyses(card)`): `NmtAnalysisCard`
  (`analysis/field.ts`; field.ts nie może importować history), `RoughnessCard`, `AiReadingCard` (history),
  `SourcesCard` (sources). Tryb `'analysis'` nazywa się w interfejsie „Kandydaci” (przegląd wyników NMT).
- Długie zadania zgłaszają się do `useActivityStore` (najprościej `trackActivity(spec, fn)` z `shared/store`):
  etykieta, postęp 0–1 albo nieokreślony, krok, `cancel`, `open` (gdzie je widać). Chip w `TopBar`
  (`app/components/ActivityChip.tsx`) pokazuje je w obu trybach, także po zamknięciu arkusza, oraz zgłoszenia
  źródeł na serwerze. Statusy źródeł odpytuje globalnie `useSourcesPolling` (montowany w `App`); nowy wynik
  dostaje `fresh` i toast. Stan pracy, który ma przetrwać zamknięcie arkusza, trzymaj w magazynie, nie w komponencie.
- Przewodnik (react-joyride) jest w `features/tutorial/config/tourSteps.ts`. Kroki wskazują elementy przez
  atrybut `data-tour`; nowy element UI dostaje krok i atrybut (test sprawdza, że każdy cel istnieje).
- Adres: `treasurefinder.pl` (worker `server/site.wrangler.toml`: pliki z `dist/`, `/api/*` do backendu pod tym samym adresem,
  aliasy `trefinder.pl` i `tresurefinder.pl` przekierowują). Stary adres GitHub Pages (build z `APP_BASE=/treasure-finder/`) pokazuje
  pasek przeprowadzki (`offline/components/MovedNotice.tsx`); dane przenosi kopia ZIP.
- PWA: `vite-plugin-pwa` w `vite.config.ts` (manifest, precache całej aplikacji). Aktualizacja tylko
  po kliknięciu „Odśwież” (`offline/components/UpdatePrompt.tsx`), żeby nie przerwać nagrywania trasy.
- Mapy offline: `features/offline` pobiera kafelki obszaru do Cache Storage (osobny cache na obszar).
  Service worker podaje kafelki z tych cache przed siecią i sam nic nie zapisuje. Kafelki NMT wybiera
  `shared/lib/tiles/pickSourceTiles.ts`, wspólne dla warstwy i pobierania: zmiana w jednym miejscu.
- Własne mapy historyczne: magazyn `maps` (obraz do 16 Mpx + georeferencja w układzie pliku, `shared/lib/georef`),
  wchodzą do kopii ZIP (wersja 4, obrazy w `mapy/`). Skan bez georeferencji może umieścić backend (`POST /api/placements`, numer arkusza
  albo nazwy); wynik to tylko start przeciągania narożników. Warstwa `WarpedImageGridLayer` przelicza dokładnie narożniki każdego kafelka, a przy
  silnym zniekształceniu dzieli kafelek na części (`map/utils/warpCells.ts`). Arkusze 1:100 000 (KdDR, WIG) backend
  znajduje po tytule: miejscowość z tytułu wskazuje oczko siatki 30′ × 15′ (`shared/lib/georef/gridSheetAt.ts`).
- Obiekty z map (`ContextFeature`, magazyn `context`) to jedna wspólna warstwa: analiza NMT liczy każdy
  bez względu na widoczną mapę. Pochodzenie jest w `seen` (mapa, lata, sposób); starsze obiekty mają je
  odczytane z `source` (`shared/lib/history/legacySightings.ts`). Nowe obiekty dodaje `addSightedObjects`:
  ten sam obiekt z innej mapy (do 80 m) dostaje nową mapę, ponowny odczyt z tej samej mapy (do 40 m) jest
  pomijany (`shared/lib/history/mergeSighting.ts`). Etykiety i odniesienia map tworzy tylko
  `features/history/utils/toViewSource.ts`.
- Odczyt map przez AI (`features/history/services/readMapWithAi.ts`): przez backend (`POST /api/readings`,
  tylko zalogowani członkowie, limit dzienny, wspólny budżet), wysyłany jest wyłącznie obraz mapy z widoku. Profile odczytu
  (rodzaj mapy: prompt, schemat, skala) w `shared/lib/history/readProfiles.ts`, wspólne dla aplikacji i workera
  (docs/BACKEND.md, „Profile odczytu”); mapa wojskowa daje kontekst `wojsko` i `grob_wojenny`
  (ostrzeżenia, ochrona przy mogiłach w `shared/lib/detect/militaryNearby.ts`). Propozycje trafiają do kontekstu
  dopiero po „Przyjmij”. Adres backendu: `shared/config/backend.ts`. Analizy na serwerze (odczyt, zgłoszenia,
  umieszczanie skanu) wymagają logowania: bez niego zamiast nich jest `SignInPrompt` z `@/shared/ui`.
- Społeczność: logowanie w `shared/auth/` (Auth0 ładowany leniwie, nagłówek członka z `memberAuth()`), kto jest
  zalogowany w `shared/store/useMembership.ts` (localStorage, nigdy w eksporcie); zaproszenia (adres e-mail) wysyła
  właściciel ze swojej poczty z panelu `#admin`, Akcja Auth0 `server/auth0/postLogin.js` wpuszcza tylko zaproszonych;
  wspólna baza przez `/api/community/` (docs/BACKEND.md), scalanie z lokalnym kontekstem w
  `features/history/utils/mergeCommunity.ts`. Udostępniać wolno tylko obiekty z map, nigdy znaleziska.
- Cieniowanie NMT z backendu: `server/src/relief` liczy kafelki od przybliżenia 12, aplikacja pokazuje je
  przez `features/map/layers/ReliefGridLayer.ts` z kafelkiem Geoportalu jako zastępstwem, póki nasz się liczy.
  Bez backendu zostaje warstwa Geoportalu (`NmtShadedLayer`).
- Mapy historyczne UMWD (WMS w EPSG:2180): stała siatka kafelków 512 px (`features/map/utils/wms2180GridSource.ts`),
  najwyżej 3 zapytania naraz, ostatnio oglądane kafelki (do 250) w Cache Storage `mapa-ogladane-mapy`
  (`viewedTileImage.ts`). To pamięć oglądania na własny użytek, nie pobieranie obszarów; regulamin UMWD
  zabrania dalszego udostępniania, więc te mapy nie idą przez backend.
- Komunikaty prawne są w `features/safety/config/legal.ts` — krótkie, rzeczowe, z linkiem do źródła.
- Ciężkie biblioteki (JSZip, proj4) ładujemy dynamicznie (`import()`), żeby start na telefonie był lekki.
  `src/shared/lib/geo/crs.ts` rejestruje EPSG:2180 leniwie — bez efektów ubocznych przy imporcie.
- Testy, które potrzebują DOM, mają na początku `// @vitest-environment jsdom`; reszta działa w `node`.

- **Jedna funkcja na plik komponentu.** Plik `.tsx` ma dokładnie jedną funkcję
  najwyższego poziomu: komponent. Pomocnicze funkcje idą do `utils/` lub `hooks/`
  (też po jednej na plik). Handlery wewnątrz komponentu są dozwolone. Pilnuje tego
  reguła `architecture/one-function-per-file` (eslint-rules/).
- Funkcja nie importuje wnętrza innej funkcji, tylko jej `index.ts` (wyjątki: lekkie wejście
  `features/analysis/field.ts` dla trybu Teren, żeby ekran analizy zostawał ładowany leniwie, oraz
  `features/sources/admin.ts`, panel przeglądu zgłoszeń ładowany leniwie pod `#admin`).
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
