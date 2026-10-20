/**
 * Short, factual legal reminders (docs/PLAN.md, "Zasady prawne i bezpieczeństwa").
 * The app does not give legal advice — every message points to the source.
 */
export const LEGAL_DETAILS_URL = 'https://isap.sejm.gov.pl/';
export const LEGAL_DETAILS_LABEL = 'Ustawa o ochronie zabytków (ISAP)';

export const FIND_REMINDER =
  'Przedmiot, który może być zabytkiem, zabezpiecz i niezwłocznie zgłoś wojewódzkiemu konserwatorowi zabytków ' +
  '(lub wójtowi, burmistrzowi). Zabytki archeologiczne należą do Skarbu Państwa.';

export const PROTECTED_REMINDER =
  'Możliwe stanowisko archeologiczne. Nie prowadź tu dalszych poszukiwań i zgłoś je wojewódzkiemu ' +
  'konserwatorowi zabytków.';

export const INTRO_POINTS = [
  'Od 1 stycznia 2027 r. poszukiwania zgłaszasz w rządowej aplikacji mobilnej albo przez e-PUAP. Potrzebujesz też zgody właściciela gruntu.',
  'Na stanowiskach archeologicznych, kurhanach i grodziskach nie szukasz. Aplikacja oznacza takie miejsca jako chronione.',
  'Znaleziony zabytek zabezpieczasz i niezwłocznie zgłaszasz. Zabytki archeologiczne należą do Skarbu Państwa.',
  'Niewybuchu nie dotykasz: oznacz miejsce, odejdź i zadzwoń pod 112.',
];

export const INTRO_DISCLAIMER =
  'Aplikacja nie udziela porad prawnych. Aktualne przepisy sprawdź u wojewódzkiego konserwatora zabytków. ' +
  'Wszystkie dane zostają na tym urządzeniu.';

export const INTRO_SEEN_KEY = 'mapa.legalIntroSeen';

export const UXO_STEPS = [
  'Nie dotykaj, nie przesuwaj i nie odkopuj.',
  'Oznacz miejsce: zapisz punkt z pozycją GPS.',
  'Odejdź na bezpieczną odległość i nie pozwól nikomu podchodzić.',
  'Zadzwoń pod 112 i podaj współrzędne.',
];

export const UXO_WARNING =
  'Teren walk lub bombardowań: ryzyko niewybuchów. Nie kop głęboko w miejscu silnego sygnału, ' +
  'nie dotykaj metalowych przedmiotów o kształcie pocisku. W razie wątpliwości odejdź i zadzwoń pod 112.';

export const WAR_GRAVES_WARNING =
  'Na terenach walk mogą być groby wojenne. Jeśli natrafisz na szczątki ludzkie, przerwij poszukiwania ' +
  'i powiadom policję.';

export const HISTORICAL_ONLINE_NOTE =
  'Tylko z internetem: dostawcy nie pozwalają pobierać tych map do pracy bez sieci.';

export const SOURCES_PRIVACY_NOTE =
  'Zdjęcia i teksty trafiają na serwer aplikacji i do Anthropic (Claude) tylko po to, by je przeanalizować. ' +
  'Prywatne zgłoszenia usuwamy po 30 dniach, możesz je usunąć wcześniej. Do wspólnej bazy trafiają tylko ' +
  'zatwierdzone obiekty z położeniem, nigdy zdjęcia.';

export const COMMUNITY_NOTE =
  'Logowanie przez Auth0 (Google): serwer zna Twój adres e-mail tylko po to, by sprawdzić zaproszenie. ' +
  'Do wspólnej bazy trafia rodzaj obiektu z mapy, jego położenie, źródło i Twoje imię; widzą je tylko ' +
  'zaproszeni członkowie. Nie udostępniaj znalezisk ani stanowisk archeologicznych: to chroni miejsca ' +
  'przed rabusiami, a Ciebie przed odpowiedzialnością.';

export const MILITARY_MAP_NOTE =
  'Mapa wojskowa pokazuje, gdzie walczono. Przy pozycjach zostają niewybuchy: nie kop głęboko przy ' +
  'silnym sygnale, niewybuchu nie dotykaj i dzwoń pod 112. Mogiły wojenne chroni ustawa o grobach i ' +
  'cmentarzach wojennych: kandydaci tuż przy mogile z mapy nie mogą być celem poszukiwań.';
