# Plan: Mapa poszukiwań w React (dla Claude Code)

17.10.2026 · @Julian

> Struktura katalogów w tym repozytorium jest feature-based (zob. CLAUDE.md):
> `src/lib/` z planu to `src/shared/lib/`, `src/ui/` to `src/shared/ui/`,
> a `src/map`, `src/field`, `src/analysis` są rozbite na foldery w `src/features/`.

## Cel projektu

Budujemy aplikację webową (PWA), która na laptopie analizuje numeryczny model terenu i typuje miejsca warte sprawdzenia, a na telefonie prowadzi w terenie i zapisuje trasy oraz znaleziska. Całość działa bez serwera i kont, a interfejs jest po polsku.

Użytkownik to hobbysta z Polski, który pracuje w QGIS i od 1 stycznia 2027 r. będzie zgłaszał poszukiwania przez aplikację rządową. Aplikacja ma mu pomóc szukać legalnie, skutecznie i bezpiecznie.

**Dwie role jednej aplikacji:**

- **Analiza (laptop):** wczytanie arkusza NMT, wizualizacje reliefu, automatyczne wykrywanie form terenu, ocena i przegląd kandydatów.
- **Teren (telefon):** mapa z warstwami, GPS na żywo, nagrywanie tras, punkty ze zdjęciami, prowadzenie do punktu.

**Punkt wyjścia:** istnieje działająca wersja 1 w jednym pliku `index.html` (Leaflet, IndexedDB, JSZip). W repozytorium leży jako `legacy/index.html`. Claude Code ma ją przeczytać i przenieść jej funkcje bez utraty zachowania, a potem rozwijać według etapów poniżej.

**Wymiana danych:** dane każdego urządzenia siedzą w jego IndexedDB. Między laptopem a telefonem przenosi się je plikiem ZIP (eksport i import). Synchronizacji przez chmurę na razie nie robimy.

## Stos technologiczny i struktura

Stos to Vite + React 18 + TypeScript w trybie strict, a mapa zostaje na Leaflet, żeby kod z wersji 1 dało się przenieść prawie wprost.

| Obszar               | Wybór                                        | Uwagi                                     |
| -------------------- | -------------------------------------------- | ----------------------------------------- |
| Budowanie            | Vite, TypeScript strict                      | `base: '/<nazwa-repo>/'` pod GitHub Pages |
| Mapa                 | Leaflet 1.9.4 + react-leaflet 4              | wersja zgodna z React 18                  |
| Stan aplikacji       | Zustand                                      | jeden store na teren, drugi na analizę    |
| Baza w przeglądarce  | idb (nakładka na IndexedDB)                  | migracje schematu po numerze wersji       |
| Rastry               | geotiff.js + własny parser ASC               | czytanie arkuszy NMT                      |
| Układy współrzędnych | proj4                                        | EPSG:2180 ↔ EPSG:4326 i EPSG:3857         |
| Pliki                | JSZip                                        | eksport i import ZIP                      |
| Obliczenia w tle     | Web Worker (moduł Vite), opcjonalnie Comlink | cała analiza NMT poza wątkiem UI          |
| Offline              | vite-plugin-pwa                              | dopiero w etapie 3                        |
| Testy                | Vitest                                       | obowiązkowe dla funkcji w `src/lib/`      |
| Deploy               | GitHub Actions → GitHub Pages                | build przy każdym pushu na `main`         |

Wygląd przenosimy z wersji 1: zmienne kolorów na `:root` z wariantem ciemnym, dolny pasek z pięcioma przyciskami, arkusze wysuwane od dołu, komunikaty typu toast. Na laptopie moduł analizy dostaje układ dwukolumnowy: mapa i lista kandydatów obok siebie.

```
mapa-poszukiwan/
├─ CLAUDE.md                  zasady dla Claude Code
├─ docs/PLAN.md               ten dokument wyeksportowany do Markdown
├─ legacy/index.html          wersja 1, źródło zachowań do przeniesienia
├─ .github/workflows/deploy.yml
├─ public/                    ikony, manifest
├─ src/
│  ├─ main.tsx, App.tsx
│  ├─ ui/                     Dock, Sheet, Toast, StatusChips, przyciski
│  ├─ map/                    MapView, warstwy, znacznik pozycji, linie tras
│  ├─ field/                  GPS, kompas, nagrywanie trasy, punkty, prowadzenie
│  ├─ analysis/               UI analizy: wczytanie arkusza, podgląd, lista kandydatów
│  ├─ workers/analysis.worker.ts
│  ├─ lib/
│  │  ├─ raster/              readAsc, readGeoTiff, fillNodata, hillshade, slope, lrm, reproject
│  │  ├─ detect/              segment, measure, classify, score
│  │  ├─ geo/                 proj (2180/4326/3857), haversine, bearing, pointInPolygon
│  │  └─ io/                  exportZip, importZip, importGeoJSON, gpx
│  ├─ db/                     schema.ts, repo.ts, migracje
│  └─ store/                  fieldStore.ts, analysisStore.ts
├─ tests/                     testy Vitest i syntetyczne modele terenu
└─ data/                      lokalne arkusze NMT do kalibracji, w .gitignore
```

Folder `data/` jest w `.gitignore`, bo repozytorium pod darmowe GitHub Pages musi być publiczne. Żadne arkusze, kafelki ani eksporty z lokalizacjami nie mogą trafić do repozytorium.

## Model danych

Wszystkie dane leżą w IndexedDB w ośmiu magazynach, a współrzędne zapisujemy w WGS84 (EPSG:4326). Wyjątkiem są rastry analizy, które zostają w siatce EPSG:2180 arkusza.

```ts
type PointType = 'anomalia' | 'sprawdzic' | 'znalezisko' | 'niewybuch' | 'inne';
type PointStatus = 'do_sprawdzenia' | 'pusto' | 'znalezisko' | 'chroniony' | 'odrzucony';
type FormClass =
  | 'kopiec_okragly'
  | 'zaglebienie_okragle'
  | 'zaglebienie_prostokatne'
  | 'row_liniowy'
  | 'wal_liniowy'
  | 'pierscien'
  | 'nieokreslony';

interface FieldPoint {
  // magazyn: points
  id: string;
  type: PointType;
  status: PointStatus;
  name: string;
  desc: string;
  depthCm: number | null;
  lat: number;
  lng: number;
  accM: number | null;
  src: 'gps' | 'mapa' | 'import' | 'analiza';
  candidateId?: string; // gdy punkt powstał z kandydata analizy
  photoId: string | null; // klucz w magazynie photos (Blob JPEG)
  created: number;
  updated: number;
}

interface Track {
  // magazyn: tracks
  id: string;
  name: string;
  start: number;
  end: number | null;
  active: boolean;
  distM: number;
  segments: [lat: number, lng: number, t: number, accM: number][][];
}

interface Sheet {
  // magazyn: sheets, metadane arkusza NMT
  id: string;
  name: string;
  crs: 'EPSG:2180';
  cellSize: number;
  cols: number;
  rows: number;
  originX: number;
  originY: number; // lewy górny róg w EPSG:2180
  boundsWgs84: [[number, number], [number, number]];
  params: AnalysisParams;
  created: number;
}

interface Candidate {
  // magazyn: candidates
  id: string;
  sheetId: string;
  form: FormClass;
  lat: number;
  lng: number;
  areaM2: number;
  lengthM: number;
  widthM: number;
  reliefM: number; // ze znakiem: + wypukłe, - wklęsłe
  circularity: number;
  elongation: number;
  rectangularity: number;
  score: number; // 0-100
  protectedLikely: boolean; // wygląda na zabytek archeologiczny
  decision: 'nowy' | 'przyjety' | 'odrzucony';
  note: string;
}

interface ContextFeature {
  // magazyn: context, obiekty z map archiwalnych
  id: string;
  kind: 'osada' | 'droga' | 'mlyn' | 'karczma' | 'brod' | 'inne' | 'wojsko' | 'grob_wojenny';
  // wojsko: pozycje, okopy, linia frontu, przeprawy, pola minowe z map wojskowych (ostrzeżenie
  // o niewybuchach w pobliżu); grob_wojenny: mogiły wojenne (nie podnoszą oceny, kandydaci
  // tuż obok są chronieni)
  geometry: GeoJSON.Geometry;
  source: string; // opis tekstowy, zostaje dla społeczności i starszych kopii
  label?: string; // co mówi mapa, np. "Młyn: Wassermühle"
  seen?: Sighting[]; // mapy, na których obiekt widziano; brak w obiektach sprzed kopii w wersji 3
  // (wtedy mapy i lata odczytujemy z source). Jedna wspólna warstwa: analiza liczy każdy obiekt
  // bez względu na widoczną mapę; ten sam obiekt z kolejnej mapy dostaje nowy wpis w seen
}

interface Sighting {
  map:
    | { kind: 'wms'; id: string; label: string; time?: number } // time: rok ortofotomapy archiwalnej
    | { kind: 'own'; id: string; label: string } // własna mapa; label zostaje po jej usunięciu
    | { kind: 'none'; label: string }; // bez mapy: ręcznie, źródło, plik, starszy opis
  years?: { from: number; to: number };
  at?: number; // ms
  how: 'ai' | 'reczne' | 'zrodlo' | 'import';
  confidence?: number; // 0-1
}

interface WaterFeature {
  // magazyn: water, cieki, kanały i wody powierzchniowe z BDOT10k (bez rowów melioracyjnych);
  // dane publiczne, nie wchodzą do kopii, import GeoJSON z polem x_kod lub kind = 'woda'
  id: string;
  geometry: GeoJSON.Geometry;
  source: string;
}

interface Zone {
  // magazyn: zones, etap 2
  id: string;
  name: string;
  kind: 'zgoda' | 'zakaz';
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  permitNo?: string;
  owner?: string;
  validUntil?: number;
}

interface CustomLayer {
  // localStorage, jak w wersji 1
  id: string;
  name: string;
  kind: 'xyz' | 'wms';
  url: string;
  layers?: string;
  maxNativeZoom: number;
  opacity: number;
  on: boolean;
}
```

Pozostałe magazyny to `photos` (Blob JPEG) i `rasters` (pochodne rastry analizy jako `Float32Array` lub gotowe PNG), żeby nie liczyć ich ponownie po odświeżeniu.

**Eksport ZIP** zawiera pliki `punkty.geojson`, `kandydaci.geojson`, `trasy.geojson`, `strefy.geojson`, `poszukiwania.gpx`, foldery `zdjecia/` i `mapy/` oraz `kopia.json` z polem `wersja: 4`. Wersja 3 dodała do obiektów z map archiwalnych pola `label` i `seen`; obiekty z kopii w wersji 1 i 2 wczytujemy bez zmian, a ich mapy i lata odczytujemy z `source`. Wersja 4 dodała własne mapy historyczne: klucz `maps` z polami `OwnMap` (`id, name, created, width, height, pixelToSource, epsg, method, visible, opacity, year`), gdzie `image` to ścieżka obrazu w archiwum (`mapy/<id>.webp`). Kopie bez `maps` wczytujemy bez zmian; sam `kopia.json` bez archiwum nie ma obrazów, więc jego mapy pomijamy.

**Zgodność wstecz jest obowiązkowa.** Import musi przyjąć `kopia.json` z wersji 1 (`wersja: 1`, klucze `points` i `tracks`, pola `id, type, name, desc, depth, lat, lng, acc, src, created, updated, photo`, zdjęcia w `zdjecia/<photo>.jpg`). Brakujący `status` ustawiamy na `do_sprawdzenia`, a `depth` i `acc` mapujemy na `depthCm` i `accM`.

## Etap 0: przeniesienie wersji 1 do React i deploy

Celem etapu 0 jest dokładnie ta sama funkcjonalność co w `legacy/index.html`, ale w nowej strukturze i z automatycznym deployem. Nowych funkcji tu nie dodajemy.

1. Utworzyć projekt Vite `react-ts`, dodać ESLint, Prettier i Vitest. Ustawić `base` w `vite.config.ts` na nazwę repozytorium.
2. Przenieść wygląd z wersji 1 jako komponenty: `Dock` (Trasa, Lista, Punkt, Warstwy, Dane), `Sheet`, `Toast`, `StatusChips`, przycisk śledzenia pozycji. Zachować zmienne kolorów, tryb ciemny i marginesy `env(safe-area-inset-*)`.
3. Mapa: podkłady OpenStreetMap, ortofotomapa (`https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution`, warstwa `Raster`) i cieniowanie NMT (`https://mapy.geoportal.gov.pl/wss/service/PZGIK/NMT/GRID1/WMS/ShadedRelief`, warstwa `Raster`), WMS 1.3.0, kafelki 512 px. Do tego nakładka NMT z suwakiem krycia i własne warstwy XYZ lub WMS zapamiętywane w localStorage.
4. GPS i trasy: `watchPosition` z `enableHighAccuracy`, odrzucanie odczytów gorszych niż 30 m i bliższych niż 2 m od poprzedniego, kompas z `deviceorientationabsolute` lub `webkitCompassHeading`, Wake Lock podczas nagrywania. Trasa zapisuje się co 8 s i przy ukryciu strony, a po ponownym otwarciu wznawia się jako nowy segment.
5. Punkty: formularz z rodzajem, nazwą, opisem, głębokością i zdjęciem (kompresja do 1600 px, JPEG 0,82), dodawanie z GPS, celownikiem albo długim przytrzymaniem mapy. Lista sortowana po odległości, szczegóły punktu, prowadzenie do punktu ze strzałką względem kompasu i wibracją na miejscu.
6. Dane: eksport ZIP i import kopii zgodne z modelem danych powyżej, w tym import kopii z wersji 1 (pole `dist` trasy mapujemy na `distM`). Import punktów z GeoJSON z QGIS, z odrzuceniem współrzędnych spoza zakresu stopni i komunikatem o układzie EPSG:4326.
7. Deploy: workflow `.github/workflows/deploy.yml` z oficjalnymi akcjami GitHub Pages (`actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`). W repozytorium: Settings, Pages, Source ustawione na GitHub Actions.

**Kryteria gotowości:**

- [ ] Na telefonie pod adresem https działają GPS, nagrywanie trasy i jej wznowienie po odświeżeniu strony.
- [ ] Kopia ZIP wyeksportowana z wersji 1 wczytuje się bez utraty punktów, tras i zdjęć.
- [ ] Eksport ZIP otwiera się w QGIS: punkty i trasy jako warstwy GeoJSON, plik GPX bez błędów.
- [ ] Push na `main` publikuje nową wersję w GitHub Pages bez ręcznych kroków.
- [ ] Brak błędów w konsoli, poprawny wygląd w trybie jasnym i ciemnym, na telefonie i na laptopie.

## Etap 1: moduł analizy NMT

Laptop wczytuje arkusz NMT, w tle liczy wizualizacje i wykrywa formy terenu, a wynikiem jest lista kandydatów z oceną 0–100. Przyjęty kandydat trafia na telefon jako punkt do sprawdzenia.

Wynik analizy to potencjał miejsca, czyli ślad dawnej działalności człowieka, a nie przewidywanie znaleziska. Tak ma być opisany w interfejsie.

### Wejście

- Arkusz NMT z Geoportalu w formacie ESRI ASCII Grid (`.asc`) albo GeoTIFF, siatka 1 m lub 0,5 m, układ EPSG:2180. Układ wysokości (KRON86 lub EVRF2007) nie ma znaczenia, bo analizujemy relief względny.
- Na start jeden arkusz do około 4 × 4 km (16 mln komórek przy 1 m). Łączenie arkuszy w mozaikę to osobne zadanie na później.
- Wartości NODATA zachowujemy w masce i wypełniamy średnią sąsiadów tylko na potrzeby obliczeń.
- Parser ASC obsługuje `xllcorner` i `xllcenter` oraz brak linii `NODATA_value`.

### Przetwarzanie

Całość działa w `analysis.worker.ts`, raportuje postęp w procentach i da się ją przerwać. Kroki:

1. **Wczytanie** pliku do `Float32Array` z metadanymi siatki.
2. **Wizualizacje:**
   - cieniowanie wielokierunkowe: 16 azymutów, wysokość słońca 35°, uśrednione;
   - nachylenie w stopniach metodą Horna;
   - model reliefu lokalnego (LRM): NMT minus NMT wygładzony filtrem średniej o promieniu R, liczonym przez obraz całkowy w czasie O(n). Domyślnie R = 15 m, suwak 5–30 m.
3. **Reprojekcja do mapy.** Siatka EPSG:2180 jest obrócona względem Web Mercatora o zbieżność południków, do ok. 2–3° na krańcach Polski, co na 2 km daje kilkadziesiąt metrów błędu. Proste `L.imageOverlay` po narożnikach jest więc niedopuszczalne. Worker przelicza obraz do siatki EPSG:3857 odwzorowaniem odwrotnym z interpolacją dwuliniową, a proj4 wywołuje tylko w węzłach rzadkiej siatki co 64 px i interpoluje między nimi.
4. **Kolory:** LRM w skali rozbieżnej od −0,5 m (niebieski) do +0,5 m (czerwony), cieniowanie i nachylenie w skali szarości. Wyniki jako PNG przez `OffscreenCanvas`, zapisane w magazynie `rasters`.
5. **Wykrywanie form:**
   - maski: wypukłe gdzie LRM > +t, wklęsłe gdzie LRM < −t, domyślnie t = 0,25 m, suwak 0,10–0,80 m;
   - otwarcie morfologiczne o promieniu 1 komórki, żeby usunąć szum;
   - spójne składowe w 8-sąsiedztwie, odrzucenie obiektów mniejszych niż 4 m² i większych niż 5000 m²;
   - pomiary każdego obiektu: pole, obwód, środek ciężkości przeliczony do WGS84, maksymalne |LRM| jako relief, osie główne z momentów (PCA) dające długość i szerokość, wydłużenie L/W, kolistość 4πA/P², prostokątność jako pole obiektu do pola prostokąta zorientowanego wzdłuż osi PCA, liczba otworów (do wykrywania pierścieni).
6. **Klasyfikacja** według tabeli poniżej.
7. **Ocena** według wzoru poniżej.
8. **Zapis** kandydatów do magazynu `candidates` i rysowanie ich na mapie.

### Klasyfikacja

Reguły są progowe, a progi trzymamy w jednym pliku konfiguracyjnym, żeby dało się je kalibrować na prawdziwych arkuszach.

| Klasa                   | Znak | Warunki startowe                                   | Możliwe interpretacje                      | Prawdopodobnie chroniony                   |
| ----------------------- | ---- | -------------------------------------------------- | ------------------------------------------ | ------------------------------------------ |
| kopiec okrągły          | +    | kolistość > 0,7; średnica 3–40 m; wysokość 0,3–3 m | kurhan, mielerz, kopiec graniczny          | tak, gdy średnica ≥ 8 m i wysokość ≥ 0,5 m |
| zagłębienie okrągłe     | −    | kolistość > 0,65; średnica 2–20 m                  | lej po bombie lub pocisku, jama, wyrobisko | nie                                        |
| zagłębienie prostokątne | −    | prostokątność > 0,8; boki 2–15 m                   | ziemianka, piwnica, zarys budynku          | nie                                        |
| rów liniowy             | −    | wydłużenie > 4; szerokość 0,5–4 m                  | okop, rów graniczny, wąwóz drogowy         | nie                                        |
| wał liniowy             | +    | wydłużenie > 4                                     | wał, miedza, nasyp drogi                   | nie                                        |
| pierścień               | +    | wał z otworem; średnica 30–200 m                   | grodzisko, szaniec                         | tak                                        |
| nieokreślony            | ±    | pozostałe                                          | –                                          | nie                                        |

Grupa co najmniej trzech kopców okrągłych w promieniu 50 m oznacza możliwe cmentarzysko kurhanowe, więc wszystkie dostają `protectedLikely: true`.

### Ocena 0–100

```
ocena = 40 × wyrazistość + 25 × kształt + 35 × kontekst

wyrazistość = min(1, |reliefM| / 1,0 m)
kształt     = dopasowanie do klasy: kolistość, prostokątność albo wydłużenie
              znormalizowane do 0–1; dla klasy nieokreślonej 0,2
kontekst    = max po obiektach ContextFeature: 1 w odległości 0 m,
              liniowo do 0 przy 300 m; +0,2 (do 1) gdy w promieniu 50 m
              są co najmniej 3 formy tej samej klasy
```

Wagi i progi można zmienić w ustawieniach analizy. Obiekty kontekstu (dawne osady, drogi, młyny, karczmy, brody) użytkownik rysuje w QGIS na podstawie map archiwalnych i importuje jako GeoJSON z polem `kind`.

Kandydat z `protectedLikely: true` albo leżący w strefie zakazu dostaje status `chroniony`. Pokazujemy go na szaro z opisem, że to prawdopodobnie stanowisko archeologiczne, i nie da się go przyjąć jako celu poszukiwań.

### Przegląd kandydatów

- Układ na laptopie: po lewej mapa z warstwą LRM i kandydatami (kolor według klasy, wielkość znacznika według oceny), po prawej lista sortowana od najwyższej oceny.
- Filtry: klasa, minimalna ocena, pokaż lub ukryj chronione i odrzucone.
- Skróty klawiszowe: J i K następny i poprzedni, A przyjmij, R odrzuć, N notatka.
- Przyjęcie tworzy `FieldPoint` typu `anomalia` ze statusem `do_sprawdzenia`, źródłem `analiza`, nazwą w rodzaju „Zagłębienie okrągłe 12 (ocena 73)” i opisem z wymiarami.
- Eksport kandydatów do `kandydaci.geojson`, żeby dało się je obejrzeć w QGIS na tle SVF z wtyczki RVT.

### Testy

Testy Vitest na syntetycznych modelach terenu 200 × 200 komórek:

- płaszczyzna nachylona 2° z kopcem gaussowskim (wysokość 1 m, promień 8 m) daje dokładnie jeden `kopiec_okragly` z `protectedLikely: true`;
- lej stożkowy (głębokość 1,5 m, średnica 8 m) daje jedno `zaglebienie_okragle`;
- rów 1,5 m × 60 m, głęboki 0,8 m, daje jeden `row_liniowy`;
- sam szum gaussowski o odchyleniu 0,05 m przy t = 0,25 m daje zero kandydatów;
- parser ASC czyta poprawnie warianty `xllcorner` i `xllcenter`;
- reprojekcja: punkt kontrolny w EPSG:2180 trafia na mapie z błędem poniżej 1 m.

**Kryteria gotowości:**

- [ ] Arkusz 4 × 4 km przy 1 m przetwarza się w mniej niż 60 s na typowym laptopie, a UI w tym czasie nie zamarza.
- [ ] Warstwa LRM nakłada się na ortofotomapę z przesunięciem poniżej 2 m.
- [ ] Na prawdziwym arkuszu z lasem z okopami i lejami lista pierwszych 20 kandydatów zawiera głównie te formy.
- [ ] Przyjęci kandydaci pojawiają się na telefonie po imporcie ZIP jako punkty do sprawdzenia.

## Etap 2: teren

Etap 2 dodaje mapę przeszukanego terenu, strefy z alertem i szybkie oznaczanie wyników w terenie. Wyniki wracają na laptop i pozwalają poprawić ocenę kandydatów.

### Mapa pokrycia

- Ustawienie „szerokość pasa przeszukania” w metrach, domyślnie 1,0 m (zakres 0,3–3 m).
- Trasy rysujemy na jednej warstwie canvas jako linie o grubości przeliczanej z metrów na piksele przy każdej zmianie przybliżenia. Rysujemy je kryjącym kolorem, a krycie ustawiamy całej warstwie, żeby nakładające się przejścia nie ciemniały.
- Dla strefy typu `zgoda` liczymy procent pokrycia: rasteryzacja strefy i pasów w siatce 0,5 m, wynik w szczegółach strefy.
- Przełącznik w Warstwach: pokrycie zamiast zwykłych linii tras.

### Strefy

- Import poligonów GeoJSON z QGIS jako `zgoda` (teren ze zgłoszeniem i zgodą właściciela) albo `zakaz` (stanowiska archeologiczne, rezerwaty, tereny bez zgody).
- Strefa zgody ma pola: numer zgłoszenia, właściciel, ważna do. Po terminie ważności aplikacja pokazuje ostrzeżenie przy starcie trasy.
- Przy każdym odczycie GPS sprawdzamy położenie względem stref (point in polygon). Wejście do strefy zakazu albo wyjście poza strefę zgody daje wibrację i czerwony pasek u góry ekranu.
- Histereza 5 m (z uwzględnieniem dokładności GPS), żeby alert nie migał na granicy.

### Wyniki w terenie

- W szczegółach punktu trzy duże przyciski: „Pusto”, „Znalezisko”, „Chronione, zgłoszę”. Każdy zmienia `status` jednym dotknięciem.
- „Znalezisko” otwiera formularz z głębokością i zdjęciem, a w eksporcie powstaje lista znalezisk (data, współrzędne, głębokość, opis, zdjęcie) gotowa do dołączenia do zgłoszenia.
- Na laptopie, po imporcie ZIP z telefonu, statusy wracają do kandydatów. Zestawienie „ile znalezisk na klasę formy” pomaga ręcznie poprawić wagi oceny.

**Kryteria gotowości:**

- [ ] Po godzinnym spacerze widać na mapie luki w pokryciu, a procent pokrycia strefy jest zgodny z oceną na oko.
- [ ] Alert strefy zakazu działa przy telefonie w kieszeni (wibracja) i nie miga na granicy.
- [ ] Statusy z telefonu wracają na laptop i widać je w liście kandydatów.

## Etap 3: tryb offline

Po etapie 3 aplikacja otwiera się i działa w lesie bez zasięgu: mapa wybranego obszaru, warstwy z analizy, GPS, trasy i punkty.

1. **Aplikacja jako PWA:** vite-plugin-pwa z manifestem (nazwa „Mapa poszukiwań”, tryb `standalone`, ikony 192 i 512 px, kolor motywu) i service workerem, który zapisuje całą aplikację przy pierwszym otwarciu.
2. **Pobieranie obszaru:** użytkownik zaznacza prostokąt na mapie i wybiera warstwy. Aplikacja liczy kafelki dla przybliżeń 12–19, pokazuje ich liczbę i szacowany rozmiar w MB, a po potwierdzeniu pobiera je do Cache Storage z paskiem postępu i limitem 3000 kafelków na obszar.
3. **Warstwa z pamięci:** własna klasa warstwy kafelków najpierw szuka kafelka w Cache Storage, a dopiero potem w sieci. Lista pobranych obszarów z datą, rozmiarem i przyciskiem usuwania jest w sekcji Dane.
4. **Warstwy z analizy** (LRM, cieniowanie) są już lokalne w magazynie `rasters`, więc działają offline bez dodatkowej pracy.

OpenStreetMap zabrania masowego pobierania kafelków ze swoich serwerów, dlatego pobieranie obszaru obejmuje tylko warstwy Geoportalu i własne kafelki użytkownika. Przy OSM interfejs pokazuje wyjaśnienie zamiast przycisku. Przed wdrożeniem trzeba sprawdzić warunki korzystania z usług WMS Geoportalu i dopasować do nich limit.

**Kryteria gotowości:**

- [ ] W trybie samolotowym aplikacja otwiera się z ekranu głównego telefonu.
- [ ] Pobrany obszar wyświetla się offline na wszystkich przybliżeniach 12–19.
- [ ] GPS, nagrywanie trasy i dodawanie punktów działają bez internetu.

## Zasady prawne i bezpieczeństwa

Aplikacja ma aktywnie pomagać szukać zgodnie z prawem: wskazuje legalne cele, omija zabytki i przypomina o obowiązkach. Te zachowania są częścią specyfikacji, a nie dodatkiem.

- **Zgłoszenie i zgoda:** od 1 stycznia 2027 r. poszukiwania zgłasza się przez rządową aplikację mobilną albo e-PUAP, a do tego potrzebna jest zgoda właściciela gruntu. Strefa zgody przechowuje numer zgłoszenia i termin ważności, a aplikacja ostrzega, gdy trasa zaczyna się poza ważną strefą.
- **Zabytki archeologiczne:** kandydaci wyglądający na kurhany, cmentarzyska kurhanowe lub grodziska dostają status `chroniony` i nie mogą zostać celem poszukiwań. Komunikat zachęca, by możliwe nowe stanowisko zgłosić wojewódzkiemu konserwatorowi zabytków.
- **Znaleziska:** przy statusie „Znalezisko” aplikacja przypomina, że przedmiot mogący być zabytkiem trzeba zabezpieczyć i niezwłocznie zgłosić, a zabytki archeologiczne należą do Skarbu Państwa.
- **Niewybuchy:** wybór rodzaju „Niewybuch” otwiera czerwony ekran z instrukcją: nie dotykaj, oznacz miejsce, odejdź, zadzwoń pod 112. Na tym ekranie jest przycisk wybierający 112 (`tel:112`) i przycisk kopiujący współrzędne.
- **Prywatność:** wszystkie dane zostają na urządzeniu. Repozytorium jest publiczne, więc `.gitignore` obejmuje `data/`, pliki `*.asc`, `*.tif`, `*.zip` i katalogi kafelków, a aplikacja nie ma żadnej telemetrii.
- **Treść w interfejsie:** komunikaty prawne są krótkie, rzeczowe i mają link do szczegółów. Aplikacja nie udziela porad prawnych i przy pierwszym uruchomieniu zaznacza, że przepisy trzeba sprawdzić u konserwatora.

## Jak pracować z Claude Code

Najlepiej realizować plan po jednym etapie na sesję: najpierw Claude Code przygotowuje plan bez pisania kodu, ty go zatwierdzasz, a dopiero potem powstaje kod z testami i commitem po każdym kroku.

### Rytm pracy

- Przed każdym etapem włącz tryb planowania (Shift+Tab). Claude Code czyta wtedy kod i przygotowuje plan, niczego nie zmieniając.
- Przeczytaj plan, popraw go w rozmowie i dopiero wtedy przełącz na zwykły tryb.
- Między etapami używaj `/clear`. Czyści rozmowę, ale `CLAUDE.md` zostaje wczytany.
- Gdy poprawiasz to samo drugi raz, zacznij od `/clear` i lepiej opisanego zadania.

### Gotowe polecenia

Etap 0, w trybie planowania:

> Przeczytaj docs/PLAN.md (sekcje Cel projektu, Stos technologiczny, Model danych, Etap 0) oraz legacy/index.html. Przygotuj plan Etapu 0 jako listę kroków z plikami, które powstaną, i testami do każdego kroku. Nie pisz jeszcze kodu.

Etap 0, wykonanie:

> Realizuj zatwierdzony plan krok po kroku. Po każdym kroku uruchom npm run test i npm run build, zrób commit i napisz w dwóch zdaniach, co już działa. Na końcu przejdź przez kryteria gotowości Etapu 0 i oznacz, które spełniłeś.

Deploy:

> Skonfiguruj deploy na GitHub Pages według punktu 7 Etapu 0. Na końcu wypisz, co dokładnie mam kliknąć w ustawieniach repozytorium na GitHubie.

Etap 1 dzielimy na cztery sesje, każdą z `/clear` na początku:

> Etap 1, część A: w src/lib/raster zaimplementuj parsery ASC i GeoTIFF, wypełnianie NODATA, cieniowanie wielokierunkowe, nachylenie, LRM i reprojekcję do EPSG:3857 zgodnie z docs/PLAN.md, z testami. Bez interfejsu.

> Etap 1, część B: w src/lib/detect zaimplementuj maski, otwarcie morfologiczne, spójne składowe, pomiary, klasyfikację i ocenę zgodnie z docs/PLAN.md. Progi trzymaj w jednym pliku konfiguracyjnym. Napisz testy na syntetycznych modelach terenu z sekcji Testy.

> Etap 1, część C: połącz części A i B w analysis.worker.ts z raportowaniem postępu i przerywaniem. Zapisuj arkusze, rastry i kandydatów w IndexedDB.

> Etap 1, część D: zbuduj interfejs przeglądu kandydatów na laptopie według sekcji Przegląd kandydatów, ze skrótami klawiszowymi i przyjmowaniem kandydatów jako punktów do sprawdzenia.

Kalibracja na prawdziwych danych:

> W folderze data/ jest arkusz NMT z mojego terenu. Napisz skrypt scripts/calibrate.ts uruchamiany przez node, który przepuści arkusz przez analizę i wypisze liczbę kandydatów w każdej klasie oraz 20 najwyżej ocenionych ze współrzędnymi WGS84. Na tej podstawie zaproponuj zmiany progów.

Współrzędne z kalibracji sprawdzasz w QGIS na tle SVF z RVT i ortofotomapy, a uwagi wracają do Claude Code jako kolejna poprawka progów. Etapy 2 i 3 prowadzisz tym samym rytmem: plan, zatwierdzenie, wykonanie, kryteria gotowości.
