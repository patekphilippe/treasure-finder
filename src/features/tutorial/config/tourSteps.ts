import type { Step } from 'react-joyride';
import type { Platform } from '@/shared/lib/pwa/detectPlatform';
import type { AppMode, SheetId } from '@/shared/store/useUiStore';

export type { Platform };

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
  when?:
    | 'candidates'
    | 'noCandidates'
    | 'legend'
    | 'exclusion'
    | 'notInstalled'
    | 'relief'
    | 'wholeMap'
    | 'compare';
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
      'Mapa (OpenStreetMap), Ortofoto, czyli zdjęcia lotnicze z Geoportalu, albo Topo, czyli mapa topograficzna 1:10 000 z poziomicami, ścieżkami i rowami (tylko z internetem).',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'layers-nmt',
    target: 'layers-nmt',
    title: 'Cieniowanie NMT',
    content:
      'Cieniowany model terenu z Geoportalu w siatce 1 m. Z bliska światło pada z 16 kierunków, jak w analizie arkusza, a kafelki przychodzą gotowe z naszego serwera. Pokazuje dołki, wały i rowy, także pod lasem. Suwakiem zmienisz krycie.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'layers-historical',
    target: 'layers-historical',
    title: 'Mapa historyczna',
    content:
      'Dawne mapy na mapie: przedwojenne mapy Messtischblatt Dolnego Śląska i zdjęcia lotnicze z wybranego roku. Pokazują osady, młyny i drogi, których dziś nie ma. Suwakiem zmienisz krycie.',
    mode: 'field',
    sheet: 'layers',
  },
  {
    id: 'community',
    target: 'community',
    title: 'Społeczność',
    content:
      'Wspólna baza dawnych wsi, młynów, karczm i brodów dla zaproszonych osób. Logujesz się kontem Google, na którego adres przyszło zaproszenie od właściciela. Swoje obiekty udostępniasz jednym kliknięciem, a punkty innych potwierdzasz albo kwestionujesz w ich szczegółach; zakwestionowane nie podnoszą oceny kandydatów.',
    mode: 'field',
    sheet: 'history',
  },
  {
    id: 'own-maps',
    target: 'own-maps',
    title: 'Własne mapy',
    content:
      'Wczytaj własną dawną mapę: GeoTIFF albo skan z PZGiK, SLUB czy mapywig.org. Skan dopasujesz, przeciągając 4 narożniki na ortofotomapę; dla Messtischblatt i WIG wystarczy numer arkusza na start. Wpisz rok mapy: obiekty z niej będą go pamiętać. Mapa zostaje w telefonie i działa bez internetu.',
    mode: 'field',
    sheet: 'history',
  },
  {
    id: 'ai-reading',
    target: 'ai-reading',
    title: 'Zaginiona zabudowa (AI)',
    content:
      'Claude czyta przez serwer analizy widoczny fragment mapy historycznej: domy, młyny, karczmy, folwarki. Aplikacja porównuje je z dzisiejszymi budynkami i proponuje miejsca, których już nie ma. Przyjęte trafiają do kontekstu i podnoszą wynik kandydatów w pobliżu.',
    mode: 'field',
    sheet: 'history',
  },
  {
    id: 'ai-profile',
    target: 'ai-profile',
    title: 'Rodzaj mapy',
    content:
      'Mapa topograficzna: Claude szuka zabudowy, młynów i karczm. Mapa wojskowa (np. sztabowa z 1945 r.): linii frontu, okopów, stanowisk, przepraw i mogił. Pozycje ostrzegają przed niewybuchami u pobliskich kandydatów, a kandydaci tuż przy mogile stają się chronieni.',
    mode: 'field',
    sheet: 'history',
  },
  {
    id: 'ai-whole-map',
    target: 'ai-whole-map',
    when: 'wholeMap',
    title: 'Cała mapa naraz',
    content:
      'Przy własnej mapie członkowie społeczności mogą przeczytać ją całą jednym przyciskiem: aplikacja dzieli ją na fragmenty, pokazuje ich liczbę, koszt i czas, a potem łączy wyniki z sąsiednich fragmentów.',
    mode: 'field',
    sheet: 'history',
  },
  {
    id: 'ai-compare',
    target: 'ai-compare',
    when: 'compare',
    title: 'Porównaj dwie mapy',
    content:
      'Ten sam widok na dwóch mapach z różnych lat. Co jest na obu, jest pewniejsze; co jest tylko na jednej, powstało albo zniknęło między nimi. Opis każdej propozycji mówi, na której mapie ją widać.',
    mode: 'field',
    sheet: 'history',
  },
  {
    id: 'history-add',
    target: 'history-add',
    title: 'Obiekty z map archiwalnych',
    content:
      'Widzisz na dawnej mapie młyn, karczmę albo wieś, której dziś nie ma? Wybierz rodzaj i wskaż miejsce celownikiem. Kandydaci z analizy NMT w pobliżu od razu dostaną wyższy wynik; liczy się rodzaj obiektu (osada działa najdalej).',
    mode: 'field',
    sheet: 'history',
  },
  {
    id: 'history-filter',
    target: 'history-filter',
    title: 'Obiekty z widocznej mapy',
    content:
      'Obiekty to jedna wspólna warstwa: każdy liczy się w analizie NMT, bez względu na to, którą mapę oglądasz. Ten przełącznik przyciemnia obiekty, których nie widziano na włączonej mapie. Ten sam młyn z kolejnej mapy nie dubluje się, tylko dostaje nową mapę; w szczegółach obiektu widać, na których mapach i z jakich lat go znaleziono.',
    mode: 'field',
    sheet: 'history',
  },
  {
    id: 'layers-sources',
    target: 'layers-sources',
    title: 'Źródła historyczne',
    content:
      'Masz zdjęcie starej mapy, fragment kroniki albo wspomnienie dziadka? Dodaj je tutaj: AI odczyta młyny, karczmy i dawną zabudowę, pokaże je na mapie, a Ty wybierzesz, co zachować.',
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
    id: 'data-install',
    target: 'data-install',
    title: 'Aplikacja na ekranie głównym',
    content:
      'Zainstaluj aplikację jak zwykłą: dostaniesz ikonę na ekranie głównym, pełny ekran i działanie bez internetu. Na iPhonie przycisk pokaże, co kliknąć w Safari.',
    mode: 'field',
    sheet: 'data',
    when: 'notInstalled',
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
