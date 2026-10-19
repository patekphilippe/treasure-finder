# Backend: analiza źródeł historycznych przez AI

`server/` to Cloudflare Worker, który przyjmuje zgłoszenia źródeł (zdjęcia map, opisy, linki) i analizuje je przez Claude. Aplikacja działa bez niego, także offline. Backend dodaje tylko zgłoszenia i analizę AI.

## Co gdzie leży

| Element               | Usługa Cloudflare            | Zawartość                                                                                |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------- |
| API i przetwarzanie   | Worker `treasure-finder-api` | `server/src/`                                                                            |
| Baza                  | D1 `treasure-finder`         | zgłoszenia, wyniki, licznik wydatków, limity dzienne, pamięć wyszukiwania nazw           |
| Pliki zgłoszeń        | R2 `tf-zrodla` (prywatny)    | zmniejszone zdjęcia i teksty                                                             |
| Zatwierdzony kontekst | R2 `tf-kontekst`             | paczki GeoJSON w siatce 0,25° i `index.json`, wydawane przez worker pod `/api/kontekst/` |
| Ochrona przed botami  | Turnstile                    | token przy każdym wysłaniu                                                               |
| Panel przeglądu       | aplikacja pod `…/#admin`     | token `ADMIN_TOKEN` (sekret workera), tylko dla właściciela                              |

## Koszty

- **Cloudflare:** plan darmowy wystarcza (Workers 100 tys. zapytań dziennie, D1 5 GB, R2 10 GB bez opłat za pobieranie, Cron, Turnstile).
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
3. `npx wrangler r2 bucket create tf-zrodla` oraz `npx wrangler r2 bucket create tf-kontekst`.
   - W panelu R2 dla `tf-zrodla` dodaj regułę cyklu życia „usuń obiekty po 30 dniach”.
   - `tf-kontekst` zostaje prywatny: paczki wydaje worker.
4. Turnstile: w panelu dodaj widżet dla `patekphilippe.github.io`. Klucz witryny trafia do zmiennej `TURNSTILE_SITE_KEY` (punkt 9), a sekret ustawiasz tak: `npx wrangler secret put TURNSTILE_SECRET`.
5. Klucz Anthropic: `npx wrangler secret put ANTHROPIC_API_KEY`.
6. `npm run db:migrate`, potem `npm run deploy`.
7. Automatyczne wdrażanie z GitHuba: w ustawieniach repozytorium dodaj sekrety `CLOUDFLARE_API_TOKEN` (szablon „Edit Cloudflare Workers” plus uprawnienia D1) i `CLOUDFLARE_ACCOUNT_ID`.

   Workflow `.github/workflows/server.yml` testuje zawsze. Wdraża tylko wtedy, gdy token jest ustawiony.

8. Panel przeglądu: `npx wrangler secret put ADMIN_TOKEN` (losowy ciąg, co najmniej 24 znaki, np. `openssl rand -base64 32`). Otwórz `https://patekphilippe.github.io/treasure-finder/#admin` i wpisz token: zostaje tylko w tej przeglądarce.
9. Aplikacja: w ustawieniach repozytorium, w zakładce Variables, dodaj `SOURCES_API_URL` (adres workera, np. `https://treasure-finder-api.<konto>.workers.dev`) i `TURNSTILE_SITE_KEY`. Następne wdrożenie strony włączy sekcję „Źródła historyczne”. Bez tych zmiennych sekcja informuje, że analiza jest wyłączona.

## Dane osobowe (RODO)

- **Co zbieramy:** to, co ktoś sam wyśle (zdjęcie, tekst, link), widok mapy w chwili wysłania, losowy identyfikator urządzenia oraz skrót (hash) adresu IP do limitów. Pełnego adresu IP nie zapisujemy.
- **Bez kont i telemetrii.**
- **Prywatne zgłoszenia** są usuwane po 30 dniach. Nadawca może je usunąć wcześniej kluczem z aplikacji.
- **Publiczne zgłoszenia:** do wspólnej bazy trafiają tylko współrzędne, rodzaj obiektu i opis źródła, nigdy zdjęcia. Pliki są usuwane po zatwierdzeniu lub odrzuceniu.
- **Anthropic** przetwarza wysłane treści na potrzeby analizy. Informacja o tym jest w aplikacji przy wysyłaniu (`features/safety/config/legal.ts`).

## Jak to działa

1. Aplikacja zmniejsza zdjęcia do 1568 px (WebP) i wysyła je z opisem, linkiem i widokiem mapy (`POST /api/submissions`).
2. Cron co 15 minut:
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
