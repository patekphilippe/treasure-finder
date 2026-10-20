# Backend: analiza źródeł historycznych przez AI

`server/` to Cloudflare Worker, który przyjmuje zgłoszenia źródeł (zdjęcia map, opisy, linki) i analizuje je przez Claude, prowadzi wspólną bazę społeczności i liczy kafelki cieniowania terenu. Aplikacja działa bez niego, także offline: bez backendu cieniowanie pochodzi wprost z Geoportalu.

## Co gdzie leży

| Element               | Usługa Cloudflare            | Zawartość                                                                                |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| Aplikacja             | Worker `treasure-finder-app` | `treasurefinder.pl`: PWA z `dist/`, `/api/*` do workera API; sekcja „Adres aplikacji”    |
| API i przetwarzanie   | Worker `treasure-finder-api` | `server/src/`                                                                            |
| Baza                  | D1 `treasure-finder`         | zgłoszenia, wyniki, licznik wydatków, limity dzienne, pamięć wyszukiwania nazw           |
| Pliki zgłoszeń        | Workers KV `SOURCES`         | zmniejszone zdjęcia i teksty (prywatne, kasowane razem ze zgłoszeniem)                   |
| Zatwierdzony kontekst | Workers KV `CONTEXT`         | paczki GeoJSON w siatce 0,25° i `index.json`, wydawane przez worker pod `/api/kontekst/` |
| Ochrona przed botami  | Turnstile                    | token przy każdym wysłaniu                                                               |
| Logowanie             | Auth0 (plan Free)            | tylko OAuth (Google), rejestracja tylko z zaproszenia; sekcja „Logowanie”                |
| Panel przeglądu       | aplikacja pod `…/#admin`     | logowanie kontem właściciela (`ADMIN_EMAILS`); `ADMIN_TOKEN` już tylko dla skryptów      |
| Kafelki cieniowania   | R2 `treasure-finder-tiles`   | gotowe kafelki 512 px (`relief/1/z/x/y`), liczone raz z NMT GUGiK                        |

## Koszty

- **Cloudflare:** Workers Paid (5 $ miesięcznie): policzenie kafelka cieniowania to ok. 0,1 s procesora, a plan darmowy daje 10 ms na zapytanie. Kafelki leżą w R2 (darmowe do 10 GB, 1 mln zapisów i 10 mln odczytów miesięcznie; wymaga karty). Reszta mieści się w limitach planu: D1, Workers KV (pliki zgłoszeń), Cron, Turnstile.
- **Anthropic:** domyślnie `claude-haiku-5-5` w Batch API (-50%), a `claude-sonnet-5-5` tylko w drugim przebiegu przy trudnych mapach.

  | Wejście       | Koszt        |
  | ------------- | ------------ |
  | zdjęcie mapy  | ok. 0,002 $  |
  | opis tekstowy | ok. 0,0002 $ |

- **Twardy limit:** `MONTHLY_BUDGET_USD` w `wrangler.toml` (domyślnie 5 $). Po jego wyczerpaniu worker dalej przyjmuje zgłoszenia, ale analizuje je dopiero w następnym miesiącu. Dodatkowo ustaw limit wydatków w konsoli Anthropic.
- **Limity nadużyć:** `PRIVATE_DAILY_LIMIT` prywatnych analiz dziennie na urządzenie i na adres IP (domyślnie 5), pliki do 10 MB, Turnstile.

## Uruchomienie (jednorazowo)

1. Konto Cloudflare, potem w `server/`: `npx wrangler login`.
2. `npx wrangler d1 create treasure-finder`: wpisz zwrócone `database_id` do `server/wrangler.toml`.
3. `npx wrangler kv namespace create SOURCES` oraz `npx wrangler kv namespace create CONTEXT`: wpisz zwrócone `id` do `server/wrangler.toml`. Prywatne zgłoszenia starsze niż 30 dni usuwa cron.
4. Turnstile: w panelu dodaj widżet dla `treasurefinder.pl` i `patekphilippe.github.io`. Klucz witryny trafia do zmiennej `TURNSTILE_SITE_KEY` (punkt 9), a sekret ustawiasz tak: `npx wrangler secret put TURNSTILE_SECRET`.
5. Klucz Anthropic: `npx wrangler secret put ANTHROPIC_API_KEY`.
6. `npm run db:migrate`, potem `npm run deploy`.
7. Automatyczne wdrażanie z GitHuba: w ustawieniach repozytorium dodaj sekrety `CLOUDFLARE_API_TOKEN` (szablon „Edit Cloudflare Workers” plus uprawnienia D1) i `CLOUDFLARE_ACCOUNT_ID`.

   Workflow `.github/workflows/server.yml` testuje zawsze. Wdraża tylko wtedy, gdy token jest ustawiony.

8. Cieniowanie: w panelu Cloudflare włącz plan Workers Paid i R2, potem `npx wrangler r2 bucket create treasure-finder-tiles` i w `wrangler.toml` wiązanie `[[r2_buckets]]` `TILES`. Token z punktu 7 potrzebuje uprawnienia „Workers R2 Storage: Edit”. Bez wiązania worker liczy każdy kafelek od nowa.
9. Logowanie i panel przeglądu: Auth0 według sekcji „Logowanie (Auth0)”. Potem otwórz `https://treasurefinder.pl/#admin` i zaloguj się kontem z `ADMIN_EMAILS`. `ADMIN_TOKEN` (`npx wrangler secret put ADMIN_TOKEN`, co najmniej 24 znaki) jest potrzebny już tylko do wywołań panelu ze skryptów.
10. Aplikacja: adres workera i klucz witryny Turnstile są wpisane jako domyślne w `src/shared/config/backend.ts` (to wartości publiczne); pod `treasurefinder.pl` backend ma ten sam adres co aplikacja (sekcja „Adres aplikacji”). Zmienne repozytorium `SOURCES_API_URL` i `TURNSTILE_SITE_KEY` mogą je nadpisać, np. dla testowego workera.

## Adres aplikacji (`treasurefinder.pl`)

Aplikacja działa pod `https://treasurefinder.pl`. Domeny są zarejestrowane w nazwa.pl, a ich DNS
prowadzi Cloudflare.

- **Worker `treasure-finder-app`** (`server/site.wrangler.toml`, `server/src/site/`) podaje
  zbudowaną aplikację z `dist/` i przekazuje `/api/*` do workera API (wiązanie usługi). Backend ma
  więc ten sam adres co aplikacja, bez CORS. Kafelki cieniowania z `/api/relief/` service worker podaje
  offline z pobranych obszarów, tak jak kafelki z innych adresów.
- **Aliasy:** `trefinder.pl`, `tresurefinder.pl` oraz `www.` wszystkich domen przekierowują na stałe (301) na `treasurefinder.pl`,
  ze ścieżką. Pod `/sw.js` aliasy podają service worker, który usuwa kopię aplikacji zainstalowaną tam
  wcześniej (`trefinder.pl` był przez kilka godzin adresem głównym), żeby kolejne wejście trafiło na przekierowanie.
- **Stary adres** `patekphilippe.github.io/treasure-finder/` działa dalej (ten sam workflow buduje go z
  `APP_BASE=/treasure-finder/`) i pokazuje pasek z nowym adresem (`offline/components/MovedNotice.tsx`).
  Przeglądarka trzyma dane osobno dla każdego adresu, więc przenosi się je kopią ZIP: na starym
  adresie Dane → Pobierz kopię, na nowym Dane → Import. Kopia od wersji 4 zawiera własne mapy. Obszary
  offline trzeba pobrać na nowo, a aplikację zainstalować jeszcze raz.

### Przeniesienie domen (jednorazowo)

1. Cloudflare → Add a domain: `treasurefinder.pl`, `trefinder.pl` i `tresurefinder.pl` (plan Free). Cloudflare poda dwa
   serwery nazw.
2. nazwa.pl → Domeny → każda z domen → zmiana serwerów DNS na te dwa z Cloudflare. Zmiana działa po
   kilku godzinach (do 48 h); Cloudflare napisze, gdy domena będzie aktywna.
3. W głównym folderze `npm run build`, potem w `server/`: `npm run deploy:site`. Pierwsze wdrożenie
   zakłada w Cloudflare domeny workera, rekordy DNS i certyfikaty.
4. Turnstile: w ustawieniach widżetu dopisz nazwę hosta `treasurefinder.pl`.
5. GitHub: zmienna repozytorium `SITE_ON_CLOUDFLARE` = `true`. Od tej chwili workflow „Deploy app”
   wdraża przy każdym pushu nowy adres i stary. Token `CLOUDFLARE_API_TOKEN` potrzebuje wtedy też
   dostępu do obu domen (Zone → Workers Routes: Edit).

## Cieniowanie (`GET /api/relief/1/{z}/{x}/{y}`)

Własne cieniowanie NMT jako kafelki mapy, w tym samym stylu co w analizie arkusza (światło z 16 kierunków wokół północnego zachodu, to samo rozciągnięcie szarości). NMT GUGiK to otwarte dane (usługa WCS: „Fees: none”, „AccessConstraints: none”), więc gotowe kafelki wolno przechowywać i wydawać.

- Kafelek Web Mercator z przybliżeń 12–16, 512 px (w aplikacji na miejscu 256 px, ostry na telefonie). Wysokości z `…/PZGIK/NMT/GRID1/WCS/DigitalTerrainModelFormatTIFF`, okno w EPSG:2180 z komórką wielkości piksela (nie drobniej niż 1 m, przy zmniejszaniu `INTERPOLATION=AVERAGE`). Szara JPEG ok. 10–50 KB; przy granicy i nad morzem PNG z przezroczystością.
- Pierwsze zapytanie liczy kafelek (2–6 s, głównie czekanie na WCS) i zapisuje go w R2; każde następne, od każdego użytkownika, idzie z R2. Wersja w adresie: nowy sposób liczenia dostaje nowy numer, więc kafelki mają `Cache-Control: immutable`.
- Limity nowych kafelków dziennie: 8000 na adres IP, 30 000 łącznie (kafelki z R2 się nie liczą). Każdy nowy kafelek to jeden zapis do R2, więc miesiąc mieści się w darmowym milionie zapisów.
- Aplikacja (`features/map/layers/ReliefGridLayer.ts`) pokazuje kafelek Geoportalu, gdy nasz nie przyjdzie w 1,2 s, i podmienia go, gdy przyjdzie. Poniżej przybliżenia 12 zostaje cieniowanie Geoportalu. Pobieranie obszaru offline bierze nasze kafelki.
- Właściwości WCS sprawdzone 20.10.2026: oś `x` to wschód, `y` północ (sprawdzone na Śnieżce, 1603 m); okna większe niż ok. 7 km wracają w połowie zerami, stąd dopiero od przybliżenia 12; poza Polską usługa zwraca 0 m, co traktujemy jak brak danych.
- Lokalnie: `wrangler dev` nie otwiera `mapy.geoportal.gov.pl` (jego środowisko nie ufa głównemu certyfikatowi Certum; na serwerach Cloudflare działa). Do testów ustaw zmienną `NMT_WCS_URL` na lokalne proxy HTTP przed tą usługą.

## Społeczność (`/api/community/`)

Mała społeczność zaufanych osób buduje wspólną bazę obiektów z map (dawne wsie, młyny, karczmy,
brody, drogi). Bazę widzą i zmieniają tylko zaproszeni członkowie.

- **Zaproszenia:** w panelu `#admin` → Członkowie → imię i adres e-mail konta Google. Panel otwiera
  gotową wiadomość w Gmailu albo programie pocztowym właściciela, z linkiem `…/#zaproszenie=<adres>`.
  Zarejestrować się może tylko zaproszony adres (sekcja „Logowanie (Auth0)”).
- **Obiekty:** członek dodaje obiekt i jest on od razu widoczny (`POST /api/community/objects`),
  autor może go usunąć, właściciel usuwa i przywraca w panelu (Wspólna baza). Limit 300 zmian dziennie
  na członka.
- **Głosy:** „Potwierdzam” / „Nie zgadza się” z notatką, jeden głos na osobę. Obiekt z co najmniej dwoma
  głosami „nie” więcej niż „tak” jest zakwestionowany: aplikacja pokazuje go na szaro i nie liczy do oceny
  kandydatów NMT; właściciel widzi go z notatkami w panelu.
- **Synchronizacja:** aplikacja pobiera obiekty dla widoku mapy (do 1° × 1°) przy otwarciu arkusza
  historii i przyciskiem; zapisuje je w lokalnym kontekście (`ContextFeature.community`).
- **Członkowie bez Turnstile:** zalogowany członek nie przechodzi weryfikacji przy odczytach map i
  zgłoszeniach; limity liczone są wtedy na członka.
- **Stara publiczna baza:** zatwierdzone zgłoszenia trafiają do D1 (`community_objects`, bez autora).
  Paczki KV przenosi `POST /api/admin/migrate-packs`; `/api/kontekst/` odpowiada 410.
- **Dane:** imię członka, adres e-mail zaproszenia, identyfikator konta Auth0, jego obiekty i głosy z
  notatkami. Bez haseł.

## Logowanie (Auth0)

Społeczność i panel właściciela wymagają logowania. Reszta aplikacji (mapa, analiza NMT, teren)
działa bez konta i offline.

- **Tylko OAuth:** w Auth0 włączone jest wyłącznie połączenie Google: bez haseł i bez rejestracji
  adresem e-mail.
- **Tylko z zaproszeniem:** zaproszenie to adres e-mail wpisany przez właściciela w panelu. Akcja
  Post-Login (`server/auth0/postLogin.js`) przy każdym logowaniu pyta worker (`POST /api/auth/check`,
  wspólny sekret `AUTH0_ACTION_SECRET`), czy adres jest zaproszony i niezablokowany; inaczej Auth0
  odmawia z polskim komunikatem i konto nie powstaje. Akcja dopisuje adres i imię do tokenu dostępu.
- **Worker sprawdza token sam:** RS256, klucze z `https://<AUTH0_DOMAIN>/.well-known/jwks.json`,
  wystawca, odbiorca `AUTH0_AUDIENCE`, ważność (`server/src/auth/`). Pierwsze logowanie zaproszonym
  adresem wiąże członka z kontem Auth0 (`auth_sub`), potem liczy się konto, nie adres. Zmiana adresu
  w panelu odpina konto: członka razem z obiektami i głosami przejmuje pierwsze logowanie nowym adresem.
- **Właściciel:** adresy z sekretu `ADMIN_EMAILS` (sekret, bo repozytorium jest publiczne) nie
  potrzebują zaproszenia, mają panel `#admin` i są członkami.
- **Aplikacja:** `@auth0/auth0-spa-js` ładuje się dopiero przy logowaniu albo zapytaniu członka
  (`src/shared/auth/`). Tokeny leżą w localStorage razem z tokenem odświeżania, więc sesja przetrwa
  zamknięcie PWA. Logowanie na chwilę przechodzi do Auth0, dlatego nie działa podczas nagrywania
  trasy. Wylogowanie dotyczy tylko tego urządzenia.
- **Dawni członkowie z kodem:** kody przestają działać z wdrożeniem workera (migracja `0006`). Dopisz
  im adres w panelu („Dopisz adres”) i wyślij zaproszenie: po zalogowaniu zachowują obiekty i głosy.

### Uruchomienie Auth0 (jednorazowo)

1. Konto na auth0.com (plan Free), tenant w regionie EU, np. `treasure-finder.eu.auth0.com`.
2. Applications → Create Application → „Single Page Application”. W Settings:
   - Allowed Callback URLs i Allowed Logout URLs: `https://treasurefinder.pl/, https://patekphilippe.github.io/treasure-finder/, http://localhost:5173/`
   - Allowed Web Origins: `https://treasurefinder.pl, https://patekphilippe.github.io, http://localhost:5173`
   - Refresh Token Rotation: włączona.
3. Authentication → Database → Username-Password-Authentication → Applications: wyłącz tę aplikację.
   Authentication → Social → Google: włącz dla aplikacji. Klucze deweloperskie Auth0 nadają się tylko
   do testów; potem utwórz klienta OAuth w Google Cloud (Credentials → OAuth client ID → Web
   application, Authorized redirect URI `https://<AUTH0_DOMAIN>/login/callback`, ekran zgody
   „External” w stanie „In production”) i wpisz jego Client ID i Secret w Auth0.
4. Applications → APIs → Create API: Identifier `https://treasure-finder-api` (to samo co
   `AUTH0_AUDIENCE`), RS256. W Settings włącz „Allow Offline Access” (tokeny odświeżania).
5. Worker: domena w `AUTH0_DOMAIN` w `server/wrangler.toml`, potem
   `npx wrangler secret put ADMIN_EMAILS` (Twój adres, kilka po przecinku) i
   `npx wrangler secret put AUTH0_ACTION_SECRET` (`openssl rand -base64 32`), `npm run db:migrate`,
   `npm run deploy`.
6. Actions → Library → Create Action → „Login / Post Login”: wklej `server/auth0/postLogin.js`, w
   Secrets dodaj `API_URL` (`https://treasurefinder.pl`) i `ACTION_SECRET` (ta sama wartość co
   `AUTH0_ACTION_SECRET`), Deploy. Actions → Triggers → post-login: przeciągnij akcję, Apply.
7. Aplikacja: domena i Client ID jako domyślne w `src/shared/config/auth.ts` (wartości publiczne)
   albo zmienne repozytorium `AUTH0_DOMAIN` i `AUTH0_CLIENT_ID`.

Bez domeny Auth0 społeczność i panel są zamknięte, a reszta aplikacji działa bez zmian.

## Odczyt widoku mapy (`POST /api/readings`)

„Szukaj zaginionej zabudowy” w aplikacji (Analizy → Odczyt mapy historycznej (AI))
wysyła obraz widoku mapy historycznej i rodzaj mapy (`profile`), a worker od razu pyta Claude
(zwykłe Messages API, bez Batch, bo użytkownik czeka na wynik) z promptem i schematem JSON tego
profilu. Zwraca listę obiektów w pikselach obrazu; porównanie z BDOT10k i grupowanie w zaginione wsie
robi aplikacja.

### Profile odczytu

Profil to „umiejętność” odczytu jednego rodzaju mapy: instrukcja z legendą (prompt), lista rodzajów
obiektów (schemat JSON), najgrubsza skala, przy której znaki są jeszcze czytelne, i limit długości
odpowiedzi. Leżą w `src/shared/lib/history/readProfiles.ts`, wspólne dla aplikacji i workera.

- `topo` (domyślny, `readPrompt.ts`): Messtischblatt, WIG i podobne mapy topograficzne; budynki,
  młyny, karczmy, folwarki i inne obiekty; widok do ok. 3 km.
- `wojskowa` (`militaryPrompt.ts`): mapy sztabowe z II wojny; linia frontu, okopy, stanowiska, punkty
  dowodzenia, przeprawy, pola minowe, mogiły; linie jako ciąg punktów; widok do ok. 12 km. W
  aplikacji pozycje dają kontekst `wojsko` (ostrzeżenie o niewybuchach u kandydatów do 300 m), mogiły
  `grob_wojenny` (ostrzeżenie do 150 m, kandydaci do 50 m chronieni).

W aplikacji z odczytów korzystają też: czytanie całej własnej mapy (okna wielkości widoku, wyniki
łączone) i porównanie widoku na dwóch mapach (`compareSites`: to samo miejsce na obu mapach jest
pewniejsze, reszta „tylko: mapa X”). Oba są dla członków, bo to kilka odczytów naraz.

Nowy rodzaj mapy (np. katastralna, Urmesstischblatt): nowy plik z promptem i schematem, wpis w
`READ_PROFILES`, rodzaje w `types.ts`, przełożenie na obiekty kontekstu w aplikacji, test i krok
przewodnika. Potok zgłoszeń (Batch) ma własne prompty w `server/src/pipeline/prompts.ts`.
Skille Claude API (Agent Skills) się tu nie nadają: działają tylko w kontenerze code execution, a
odczyt to jedno wywołanie ze schematem JSON. Do dodawania profili jest skill Claude Code
`.claude/skills/profil-odczytu-mapy` (wywołanie: `/profil-odczytu-mapy` albo prośba o nowy rodzaj mapy).

- **Ochrona:** Turnstile przy każdym odczycie, limit 300 odczytów dziennie na urządzenie i na adres IP
  (własny licznik `read:…`, nie zużywa limitu zgłoszeń), obraz do 3 MB i 1600 px na bok. Zalogowany
  członek społeczności nie przechodzi Turnstile i ma 1000 odczytów dziennie: tyle potrzeba, by przeczytać
  wiele własnych map w całości (aplikacja dzieli mapę na okna wielkości widoku i łączy wyniki).
  Na czas prac nad odczytem limity są podniesione z 30 i 100; wydatki i tak zatrzymuje budżet miesięczny.
- **Budżet:** wspólny z potokiem zgłoszeń (`MONTHLY_BUDGET_USD`). Przed wywołaniem worker sprawdza,
  czy najgorszy przypadek (3000 tokenów wejścia i limit wyjścia profilu: 4096, a dla mapy wojskowej 8192) zmieści się w budżecie; liczy koszt bez rabatu Batch.
- **Koszt:** Haiku ok. 0,0005–0,002 $ za widok, Sonnet ok. 20 razy więcej.
- **Prywatność:** obraz służy tylko do tego jednego wywołania, worker go nie zapisuje. Wraz z nim
  idzie losowy identyfikator urządzenia (do limitu) i nic więcej.

## Umieszczanie skanu (`POST /api/placements`)

Przy imporcie własnej mapy bez georeferencji (Historia → Własne mapy, opcja „Automatycznie: po nazwach
na mapie”) aplikacja wysyła pomniejszony obraz (do 1568 px) i obecny widok jako podpowiedź. Worker
pyta Claude (Haiku, jedno wywołanie) o serię, numer arkusza, ramkę i nazwy, bez obiektów, więc
odpowiedź jest krótka, a potem używa `placeMap` z potoku zgłoszeń: najpierw numer arkusza z ramką
(dokładność starego układu, ok. 150 m), potem nazwy z gazetera. Zwraca narożniki obrazu.

- To tylko punkt startowy: aplikacja od razu otwiera przeciąganie narożników. Nazwy na małym wycinku
  potrafią wskazać miejsce o setki metrów obok (etykieta lasu zamiast wsi, gmina zamiast miejscowości),
  więc przy mniej niż sześciu nazwach `placeByNames` wymaga dopasowania z błędem do 150 m, a inaczej
  zwraca nic. Wtedy aplikacja kładzie skan w widoku jak dotąd.
- Ochrona i koszt jak przy odczycie widoku: Turnstile albo zalogowany członek, jeden odczyt z dziennego
  limitu, wspólny budżet; obraz nie jest zapisywany.

## Dane osobowe (RODO)

- **Co zbieramy:** to, co ktoś sam wyśle (zdjęcie, tekst, link), widok mapy w chwili wysłania, losowy identyfikator urządzenia oraz skrót (hash) adresu IP do limitów. Pełnego adresu IP nie zapisujemy.
- **Bez telemetrii.** Konta mają tylko zaproszeni członkowie społeczności: Auth0 trzyma konto (adres, imię i zdjęcie z Google), worker adres zaproszenia i identyfikator konta. Reszta aplikacji działa bez konta.
- **Prywatne zgłoszenia** są usuwane po 30 dniach. Nadawca może je usunąć wcześniej kluczem z aplikacji.
- **Publiczne zgłoszenia:** do wspólnej bazy trafiają tylko współrzędne, rodzaj obiektu i opis źródła, nigdy zdjęcia. Pliki są usuwane po zatwierdzeniu lub odrzuceniu.
- **Anthropic** przetwarza wysłane treści na potrzeby analizy. Informacja o tym jest w aplikacji przy wysyłaniu (`features/safety/config/legal.ts`).

## Jak to działa

1. Aplikacja zmniejsza zdjęcia do 1568 px (WebP) i wysyła je z opisem, linkiem i widokiem mapy (`POST /api/submissions`).
2. Cron co minutę na czas prac nad potokiem (docelowo co 15 minut). Blokada w D1 (`pipeline_lock`) pilnuje,
   żeby przebiegi się nie nakładały: dłuższy przebieg nie odbierze ani nie wyśle tych samych zgłoszeń dwa razy.
   - odbiera zakończone wsady;
   - wysyła nowe zgłoszenia jednym wsadem (Batch API, Files API z plikami wygasającymi po 2 dniach).
3. Mapa jest umieszczana na dzisiejszej mapie:
   - z numeru arkusza i narożników ramki (skorowidze z `docs/MAPY_HISTORYCZNE.md`);
   - albo z co najmniej 3 nazw miejscowości odczytanych z mapy i znalezionych w OpenStreetMap (Nominatim, z pamięcią w D1);
   - błędne dopasowania są odrzucane.

   Opisy tekstowe: miejsce odniesienia, kierunek i odległość.

4. Trudne mapy (słaba czytelność, niska pewność, brak położenia) dostają drugi odczyt przez Sonnet.
5. Wynik prywatny trafia od razu do „Moje analizy”. Publiczny czeka w panelu `#admin`: poprawiasz rodzaj i położenie, zatwierdzasz, a obiekty trafiają do paczki regionu. Zdjęcia są wtedy kasowane.
6. W aplikacji przycisk „Pobierz dla widoku na mapie” pobiera paczki z widoku do obiektów archiwalnych.

Uwaga: porównanie z dzisiejszą zabudową BDOT10k robi aplikacja (`features/history`), nie worker. Worker nie dekoduje obrazów, żeby zmieścić się w limicie czasu procesora darmowego planu.
