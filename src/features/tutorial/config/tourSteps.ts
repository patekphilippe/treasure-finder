import type { Step } from 'react-joyride';
import type { AppMode, SheetId } from '@/shared/store/useUiStore';

export type Platform = 'ios' | 'android' | 'desktop';

export interface TourStep {
  id: string;
  /** value of the `data-tour` attribute, or null for a centred step */
  target: string | null;
  title: string;
  content: string;
  /** replaces `content` when the steps differ per device */
  contentByPlatform?: Record<Platform, string>;
  /** the app state the step needs: mode and the open sheet */
  mode: AppMode;
  sheet?: SheetId;
  placement?: Step['placement'];
  /** step only makes sense when its element exists */
  when?: 'candidates' | 'noCandidates' | 'legend' | 'exclusion' | 'notInstalled' | 'relief';
}

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'welcome',
    target: null,
    title: 'Witaj w aplikacji',
    content:
      'Krótki przewodnik po wszystkich funkcjach. Możesz go przerwać w każdej chwili i wrócić do niego przyciskiem ze znakiem zapytania na górze ekranu.',
    mode: 'field',
  },
  {
    id: 'mode',
    target: 'mode-switch',
    title: 'Teren i Analiza',
    content:
      'Teren to praca w polu na telefonie: mapa, GPS, punkty i trasy. Analiza to praca przy komputerze: wczytujesz arkusz NMT i oceniasz miejsca warte sprawdzenia.',
    mode: 'field',
  },
  {
    id: 'gps',
    target: 'gps-chip',
    title: 'Sygnał GPS',
    content:
      'Dokładność Twojej pozycji w metrach. Podczas nagrywania trasy obok pojawia się czerwony znacznik Nagrywanie.',
    mode: 'field',
  },
  {
    id: 'map',
    target: null,
    title: 'Mapa',
    content:
      'Przesuwaj i przybliżaj palcami. Przytrzymaj palec na mapie, aby dodać punkt w tym miejscu. Dotknij znacznika punktu, strefy albo numerowanego kółka, aby zobaczyć szczegóły. Krzyżyk na środku służy do wskazywania miejsc.',
    mode: 'field',
  },
  {
    id: 'follow',
    target: 'follow',
    title: 'Śledź pozycję',
    content:
      'Utrzymuje Cię na środku mapy i obraca strzałkę zgodnie z kompasem. Dotknij ponownie, aby wyłączyć.',
    mode: 'field',
    placement: 'top-end',
  },
  {
    id: 'dock',
    target: 'dock',
    title: 'Dolny pasek',
    content:
      'Pięć przycisków otwiera panele: Trasa, Lista, Punkt, Warstwy i Dane. Dotknięcie przycisku otwartego panelu zamyka go.',
    mode: 'field',
    placement: 'top',
  },
  {
    id: 'recording',
    target: 'recording',
    title: 'Nagrywanie trasy',
    content:
      'Włącz przed wyjściem w pole. Ekran nie wygaśnie podczas nagrywania. Jeśli zaczynasz poza strefą ze zgodą właściciela albo w strefie zakazu, aplikacja Cię ostrzeże.',
    mode: 'field',
    sheet: 'tracks',
  },
  {
    id: 'saved-tracks',
    target: 'saved-tracks',
    title: 'Zapisane trasy',
    content:
      'Zakończone trasy są tutaj i na mapie. Z tras powstaje też mapa pokrycia, którą włączysz w Warstwach.',
    mode: 'field',
    sheet: 'tracks',
  },
  {
    id: 'points',
    target: 'sheet',
    title: 'Lista punktów',
    content:
      'Wszystkie punkty od najbliższego. Dotknij punktu, aby zobaczyć szczegóły: status (Pusto, Znalezisko, Chronione), przycisk Prowadź ze strzałką do celu, edycję, kopiowanie współrzędnych i usuwanie.',
    mode: 'field',
    sheet: 'points',
  },
  {
    id: 'point-location',
    target: 'location-picker',
    title: 'Nowy punkt: miejsce',
    content:
      'Środkowy przycisk paska dodaje punkt. Zapiszesz go w bieżącej pozycji GPS albo wskażesz krzyżykiem na mapie.',
    mode: 'field',
    sheet: 'addPoint',
  },
  {
    id: 'point-type',
    target: 'point-type',
    title: 'Rodzaj punktu',
    content:
      'Anomalia, Do sprawdzenia, Znalezisko, Niewybuch albo Inne. Przy niewybuchu aplikacja przypomni, co robić: nie dotykaj, odejdź i zadzwoń pod 112.',
    mode: 'field',
    sheet: 'addPoint',
  },
  {
    id: 'point-details',
    target: 'point-details',
    title: 'Opis i zdjęcie',
    content:
      'Nazwa uzupełni się sama. Dopisz opis, głębokość w centymetrach i zrób zdjęcie, a potem dotknij Zapisz punkt.',
    mode: 'field',
    sheet: 'addPoint',
  },
  {
    id: 'layers-base',
    target: 'layers-base',
    title: 'Podkład',
    content:
      'Mapa (OpenStreetMap), Ortofoto, czyli zdjęcia lotnicze z Geoportalu, albo Topo, czyli mapa topograficzna 1:10 000 z poziomicami, ścieżkami i rowami.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'layers-nmt',
    target: 'layers-nmt',
    title: 'Cieniowanie NMT',
    content:
      'Cieniowany model terenu z Geoportalu w siatce 1 m. Pokazuje dołki, wały i rowy, także pod lasem. Suwakiem zmienisz krycie.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'layers-search-zones',
    target: 'layers-search-zones',
    title: 'Strefy poszukiwań',
    content:
      'Miejsca przyjęte w trybie Analiza razem z obszarem wokół formy terenu, gdzie warto szukać.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'layers-roughness',
    target: 'layers-roughness',
    title: 'Teren nierówny',
    content:
      'Analizuj ten widok sprawdza widoczny fragment mapy i zaznacza, gdzie jest dużo dołków, kopców i rowów. Zabudowa, drogi i woda są pomijane. Oznaczone miejsca dostają numery na mapie i trafiają na listę w tej sekcji.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'legend',
    target: 'legend',
    title: 'Legenda',
    content: 'Objaśnia kolory mapy terenu nierównego i numerowane kółka obszarów do sprawdzenia.',
    mode: 'field',
    placement: 'top-start',
    when: 'legend',
  },
  {
    id: 'layers-coverage',
    target: 'layers-coverage',
    title: 'Mapa pokrycia',
    content:
      'Pokazuje nagrane trasy jako przeszukane pasy, więc od razu widać luki. Suwakiem ustawisz szerokość pasa, np. zasięg cewki wykrywacza.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'layers-zones',
    target: 'layers-zones',
    title: 'Strefy zgód i zakazów',
    content:
      'Wczytaj z pliku GeoJSON tereny ze zgodą właściciela i miejsca, gdzie szukać nie wolno. Gdy wejdziesz do strefy zakazu albo wyjdziesz poza zgodę, u góry ekranu pojawi się ostrzeżenie.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'layers-custom',
    target: 'layers-custom',
    title: 'Własne warstwy',
    content: 'Dodaj podkład XYZ albo usługę WMS, np. mapę archiwalną z własnego serwera.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'data-export',
    target: 'data-export',
    title: 'Eksport',
    content:
      'Jeden plik ZIP z punktami, trasami i zdjęciami: GeoJSON i GPX do QGIS oraz kopia zapasowa. Dane są tylko na tym urządzeniu, więc rób kopię regularnie.',
    mode: 'field',
    sheet: 'data',
  },
  {
    id: 'data-import',
    target: 'data-import',
    title: 'Import',
    content:
      'Wczytaj kopię z innego urządzenia albo GeoJSON z QGIS: punkty, kontekst z map archiwalnych lub wody z BDOT10k. Dane są łączone, nic nie zostanie usunięte.',
    mode: 'field',
    sheet: 'data',
  },
  {
    id: 'data-offline',
    target: 'data-offline',
    title: 'Mapy offline',
    content:
      'Zapisz ortofotomapę i cieniowanie NMT wybranego obszaru, zanim pojedziesz w teren bez zasięgu. Ustawiasz obszar w ramce na mapie, aplikacja pokazuje liczbę kafelków i rozmiar przed pobraniem.',
    mode: 'field',
    sheet: 'data',
  },
  {
    id: 'analysis',
    target: 'analysis-panel',
    title: 'Tryb Analiza',
    content:
      'Panel kandydatów, czyli miejsc wskazanych przez analizę terenu. Na komputerze jest z prawej strony, na telefonie na dole.',
    mode: 'analysis',
  },
  {
    id: 'load-sheet',
    target: 'load-sheet',
    title: 'Wczytaj arkusz NMT',
    content:
      'Plik .asc albo GeoTIFF z Geoportalu w układzie EPSG:2180. Analiza rozpoznaje formy terenu, np. leje, okopy, ziemianki i kurhany, pomija zabudowę i wskazuje strefy poszukiwań.',
    mode: 'analysis',
  },
  {
    id: 'analysis-settings',
    target: 'analysis-settings',
    title: 'Ustawienia analizy',
    content:
      'Promień reliefu lokalnego i próg wysokości działają przy następnym wczytaniu arkusza. Wagi oceny (wyrazistość, pewność, kontekst) przeliczają oceny od razu; zestawienie znalezisk z terenu podpowie, którą podnieść.',
    mode: 'analysis',
  },
  {
    id: 'import-candidates',
    target: 'import-candidates',
    title: 'Wczytaj kandydatów',
    content: 'Plik kandydaci.geojson, np. z analizy zrobionej na innym komputerze albo w QGIS.',
    mode: 'analysis',
  },
  {
    id: 'sheet-relief',
    target: 'sheet-relief',
    title: 'Relief z arkusza',
    content:
      'Warstwy policzone z Twojego arkusza: LRM (niebieskie dołki, czerwone garby), cieniowanie z 16 kierunków i nachylenie. Zostają w telefonie, więc działają bez internetu; ten sam wybór jest w Warstwach w trybie Teren.',
    mode: 'analysis',
    when: 'relief',
  },
  {
    id: 'exclusion',
    target: 'exclusion-summary',
    title: 'Pominięte z BDOT10k',
    content:
      'Co analiza ostatniego arkusza pominęła: zabudowę, drogi i kolej oraz wody. Przełącznik Na mapie pokazuje te obszary kolorami z listy.',
    mode: 'analysis',
    when: 'exclusion',
  },
  {
    id: 'filters',
    target: 'analysis-filters',
    title: 'Filtry',
    content:
      'Zawężają listę według priorytetu i rodzaju formy. Możesz też pokazać odrzucone, naturalne i chronione miejsca.',
    mode: 'analysis',
    when: 'candidates',
  },
  {
    id: 'candidates',
    target: 'candidate-list',
    title: 'Ocena kandydatów',
    content:
      'Wybierz kandydata, aby zobaczyć, dlaczego został wskazany i jaką ma strefę poszukiwań. Przyjęte strefy trafiają do trybu Teren. Miejsc chronionych, np. kurhanów, nie da się przyjąć. Na komputerze: J i K przełączają, A przyjmuje, R odrzuca, N dodaje notatkę.',
    mode: 'analysis',
    placement: 'left',
    when: 'candidates',
  },
  {
    id: 'candidates-empty',
    target: 'analysis-panel',
    title: 'Ocena kandydatów',
    content:
      'Po wczytaniu arkusza pojawi się tu lista. Wybierz kandydata, aby zobaczyć, dlaczego został wskazany i jaką ma strefę poszukiwań. Przyjęte strefy trafiają do trybu Teren. Miejsc chronionych, np. kurhanów, nie da się przyjąć.',
    mode: 'analysis',
    when: 'noCandidates',
  },
  {
    id: 'install',
    target: null,
    title: 'Zainstaluj aplikację',
    content: '',
    contentByPlatform: {
      ios: 'W Safari dotknij Udostępnij (kwadrat ze strzałką), potem Do ekranu początkowego i Dodaj. Aplikacja otworzy się z ikony na pełnym ekranie i zadziała bez internetu. Najpierw zrób kopię w Dane, bo zainstalowana aplikacja na iPhonie ma osobne dane.',
      android:
        'W Chrome dotknij menu ⋮ i wybierz Zainstaluj aplikację. Aplikacja otworzy się z ikony na pełnym ekranie i zadziała bez internetu.',
      desktop:
        'W Chrome kliknij ikonę Zainstaluj na końcu paska adresu albo w menu ⋮ wybierz Przesyłaj, zapisz i udostępnij, a potem Zainstaluj stronę jako aplikację. Na telefonie zainstalujesz ją z menu przeglądarki.',
    },
    mode: 'field',
    when: 'notInstalled',
  },
  {
    id: 'help',
    target: 'help',
    title: 'Przewodnik w każdej chwili',
    content:
      'Ten przycisk uruchamia przewodnik ponownie. Powodzenia w terenie i szukaj zgodnie z prawem.',
    mode: 'field',
  },
];
