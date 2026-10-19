# Backend: analiza źródeł historycznych przez AI

`server/` to Cloudflare Worker, który przyjmuje zgłoszenia źródeł (zdjęcia map, opisy, linki) i analizuje je przez Claude. Aplikacja działa bez niego, także offline. Backend dodaje tylko zgłoszenia i analizę AI.

## Co gdzie leży

| Element               | Usługa Cloudflare            | Zawartość                                                                      |
| --------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| API i przetwarzanie   | Worker `treasure-finder-api` | `server/src/`                                                                  |
| Baza                  | D1 `treasure-finder`         | zgłoszenia, wyniki, licznik wydatków, limity dzienne, pamięć wyszukiwania nazw |
| Pliki zgłoszeń        | R2 `tf-zrodla` (prywatny)    | zmniejszone zdjęcia i teksty                                                   |
| Zatwierdzony kontekst | R2 `tf-kontekst` (publiczny) | paczki GeoJSON i `index.json`, czytane przez aplikację                         |
| Ochrona przed botami  | Turnstile                    | token przy każdym wysłaniu                                                     |
| Panel przeglądu       | Cloudflare Access            | dostęp tylko dla właściciela                                                   |

## Koszty

- **Cloudflare:** plan darmowy wystarcza (Workers 100 tys. zapytań dziennie, D1 5 GB, R2 10 GB bez opłat za pobieranie, Cron, Turnstile, Access do 50 osób).
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
   - Dla `tf-kontekst` włącz publiczny dostęp (domena r2.dev albo własna).
4. Turnstile: w panelu dodaj widżet dla `patekphilippe.github.io`. Klucz witryny trafia do konfiguracji aplikacji, a sekret ustawiasz tak: `npx wrangler secret put TURNSTILE_SECRET`.
5. Klucz Anthropic: `npx wrangler secret put ANTHROPIC_API_KEY`.
6. `npm run db:migrate`, potem `npm run deploy`.
7. Automatyczne wdrażanie z GitHuba: w ustawieniach repozytorium dodaj sekrety `CLOUDFLARE_API_TOKEN` (szablon „Edit Cloudflare Workers” plus uprawnienia D1) i `CLOUDFLARE_ACCOUNT_ID`.

   Workflow `.github/workflows/server.yml` testuje zawsze. Wdraża tylko wtedy, gdy token jest ustawiony.

8. Panel `/admin`: Cloudflare Zero Trust, potem Access, potem aplikacja dla ścieżki `/api/admin/*`, z dostępem tylko dla Twojego e-maila.

## Dane osobowe (RODO)

- **Co zbieramy:** to, co ktoś sam wyśle (zdjęcie, tekst, link), widok mapy w chwili wysłania, losowy identyfikator urządzenia oraz skrót (hash) adresu IP do limitów. Pełnego adresu IP nie zapisujemy.
- **Bez kont i telemetrii.**
- **Prywatne zgłoszenia** są usuwane po 30 dniach. Nadawca może je usunąć wcześniej kluczem z aplikacji.
- **Publiczne zgłoszenia:** do wspólnej bazy trafiają tylko współrzędne, rodzaj obiektu i opis źródła, nigdy zdjęcia. Pliki są usuwane po zatwierdzeniu lub odrzuceniu.
- **Anthropic** przetwarza wysłane treści na potrzeby analizy. Informacja o tym jest w aplikacji przy wysyłaniu (`features/safety/config/legal.ts`).
