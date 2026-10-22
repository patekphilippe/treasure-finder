# Plan nauki: własny backend (FastAPI) projektowany od zera, patrząc na frontend + DevOps na Azure

## Kontekst

Chcesz nauczyć się backendu i DevOps. Patrzysz na gotową aplikację **jak użytkownik**: co pokazuje
i co robi. Sam decydujesz, które funkcje zostają, które wyrzucasz, a które zmieniasz. Pod nie sam
projektujesz endpointy, dane i bazę. **Nie podglądasz** obecnego backendu (`server/`), zapytań
w DevTools ani typów w `src/shared/types/`. Gdy Twoje API będzie gotowe, **dostrajamy frontend
pod Twoje endpointy** (pliki `services/` w FE). Docelowo Twój backend zastępuje Workera.

**Ty piszesz kod.** Ja jestem mentorem: tłumaczę, zadaję pytania naprowadzające („co, jeśli dwie
osoby zagłosują naraz?”), robię review PR, pomagam przy błędach. Gotowe rozwiązanie daję tylko,
gdy wprost poprosisz.

## Cykl dla każdej funkcji

1. **Oglądasz** funkcję w aplikacji (`npm run dev`), klikając jak użytkownik.
2. **Decydujesz**: zostaje / wyrzucam / zmieniam. Spisujesz to w 2–3 zdaniach (historyjka: „jako członek chcę…”).
3. **Projektujesz** swoje API: endpointy, dane wejścia/wyjścia, błędy, uprawnienia. Potem tabele. Ja robię review projektu.
4. **Implementujesz** w FastAPI z testami `pytest`.
5. **Dostrajamy FE** pod Twoje endpointy (zmiana w `src/features/*/services/`, `npm run test`), uruchamiamy
   aplikację na Twoim backendzie (`VITE_SOURCES_API_URL=http://localhost:8000 npm run dev`) i sprawdzamy w przeglądarce.

## Funkcje do przejrzenia (co widać w aplikacji)

- Logowanie członków społeczności, zaproszenia, panel właściciela (`#admin`).
- Wspólna baza obiektów z map (dodawanie, głosy „Potwierdzam / Nie zgadza się”, usuwanie).
- Wspólne stare mapy (wgrany skan widoczny dla innych członków).
- Odczyt mapy przez AI i automatyczne umieszczanie skanu na mapie.
- Zgłoszenia źródeł do analizy i ich przegląd.
- Cieniowanie terenu (kafelki mapy).

Kolejność ustalasz sam; proponuję od najprostszej z danymi: logowanie → wspólna baza obiektów → mapy → AI → zgłoszenia → cieniowanie.

## Decyzje projektowe (Twoje)

Konto i społeczność (z przeklikania aplikacji):
- [zostaje] Zalogowanie i wylogowanie.
- [zostaje] Panel właściciela.
- [zostaje] Właściciel zatwierdza i odrzuca zgłoszenia.
- [zostaje] Właściciel dodaje i usuwa członków.
- [zostaje] Właściciel usuwa i przywraca obiekty we wspólnej bazie.
- [upraszczam] Zamiast głosów „Potwierdzam / Nie zgadza się” jest tylko przycisk **„Zgłoś błąd”** przy obiekcie.
  - Po zgłoszeniu obiekt wygląda normalnie; zgłoszenie czeka w panelu właściciela (usuń obiekt / odrzuć zgłoszenie).
  - Zgłaszający wybiera powód z listy. Powody (wersja 2):
    - „Zła kategoria (zły odczyt z legendy)”
    - „Na mapie nie ma takiego oznaczenia”
    - „Złe miejsce” (oznaczenie jest, ale obiekt stoi obok)
    - „Inne” — opis **obowiązkowy** (serwer odrzuca zgłoszenie bez opisu)
  - Przy pozostałych powodach opis opcjonalny.
  - Jedna osoba zgłasza dany obiekt tylko raz (drugi raz: „już zgłoszone”).
  - Identyfikatory powodów (baza i API): `wrong_category`, `not_on_map`, `wrong_position`, `other`.
    Polskie napisy są tylko w interfejsie.
  - Właściciel rozpatruje zgłoszenie: usuwa obiekt albo odrzuca zgłoszenie (obiekt zostaje).
  - Do przemyślenia przez Ciebie: dlaczego identyfikatory, a nie polskie zdania.
- [do sprawdzenia] Co robi zwykły członek: skąd biorą się obiekty we wspólnej bazie i kto je dodaje.

## Projekt API „Zgłoś błąd” (wersja robocza 1, Twoja)

```
zgłoś błąd:        POST ???   { reason*: wrong_category | not_on_map | wrong_position | other, reason_description }   błędy: 404, ?
rozpatrz zgłoszenie: POST ???   { approved*: boolean }   błędy: 404, ?
```

Do poprawy po review (robisz Ty, wersja 2):
- Adresy: zasoby jako rzeczowniki, akcja wyrażona metodą HTTP (zgłoszenie należy do obiektu; rozpatrzenie zmienia zgłoszenie).
- Brakuje akcji: właściciel musi zobaczyć listę zgłoszeń do rozpatrzenia.
- Co wraca z każdego wywołania (kod sukcesu i treść).
- `approved: boolean` jest niejednoznaczne (zatwierdzam zgłoszenie = usuwam obiekt?); nazwa mówiąca, co się stało.
- Kto zgłasza: z tokenu logowania, nie z treści zapytania.
- Błędy: niezalogowany, nie-właściciel, „Inne” bez opisu, drugie zgłoszenie, zgłoszenie już rozpatrzone, obiekt usunięty.

## Na później (świadomie odłożone)

- Powiadomienia dla zgłaszającego o decyzji właściciela: skrzynka w aplikacji (bez Web Push), gotowy tekst
  + opcjonalny dopisek. Otwarte pytania: skąd aplikacja wie, które są nowe (pole „przeczytane” vs „od chwili X”).
- Edycja miejsca i kategorii obiektu przez właściciela.

## Zasady

- Kod w `backend/`. Worker działa, póki Twój backend nie przejmie funkcji; aplikacja nic nie traci w trakcie nauki.
- Każdy krok = gałąź + PR + moje review. Krok skończony, gdy przechodzą `pytest`, `ruff`, `mypy`,
  funkcja działa w aplikacji, a Ty umiesz obronić swoje decyzje.
- Zmiana FE pod Twoje API idzie w tym samym kroku, z `npm run test` i `npm run build`.
- Sekrety (Anthropic, Auth0) tylko w Key Vault / `.env` poza repo. Bez telemetrii użytkowników.

## Etapy nauki

0. **Warsztat (1 tydz.):** Python 3.12, `uv`, `pytest`, `ruff`, `mypy`, git. Szkielet `backend/`. Spis funkcji z decyzjami „zostaje / wyrzucam / zmieniam”.
1. **Pierwsze API (1–2 tyg.):** HTTP, REST, kody błędów, CORS, FastAPI, Pydantic, `/api/health`; FE łączy się z Twoim backendem.
2. **Logowanie (1–2 tyg.):** OAuth/OIDC, JWT, Auth0 (FE już loguje), role członek/właściciel, zaproszenia.
3. **Baza + wspólna baza obiektów (3–4 tyg.):** SQL, PostgreSQL w Dockerze, SQLAlchemy 2, Alembic, PostGIS, limity nadużyć.
4. **Docker i CI (1 tydz.):** Dockerfile, GitHub Actions (lint, testy, obraz).
5. **Azure (2 tyg.):** Container Apps, Container Registry, PostgreSQL Flexible Server, Key Vault, Managed Identity, Bicep, wdrożenie przez OIDC, alert budżetu (Azure for Students, jeśli się da).
6. **Pliki: wspólne mapy (1–2 tyg.):** Blob Storage, duże pliki, uprawnienia.
7. **AI (2–3 tyg.):** Anthropic SDK w Pythonie: obraz, wynik w schemacie, koszty, budżet, limity.
8. **Zadania w tle (1–2 tyg.):** kolejka, zadania cykliczne (Container Apps Job), idempotencja.
9. **Cieniowanie terenu (2 tyg.):** numpy, rastry, PNG, cache.
10. **Produkcja i przełączenie (1–2 tyg.):** dev/prod, backupy, logi, rollback, przeniesienie danych społeczności, wyłączenie Workera, aktualizacja `docs/BACKEND.md` i `CLAUDE.md`.

## Agenci AI pod projekt (równolegle, od etapu 2)

Claude Code w repo: subagent do review backendu (`.claude/agents/`), skill „nowa funkcja” (historyjka → API → test → migracja → zmiana FE), hook z `ruff`/`pytest`. W etapie 7 agent z narzędziami (tool use) w samym backendzie.

## Weryfikacja (każdy etap)

- `cd backend && uv run pytest && uv run ruff check && uv run mypy .`
- FE na Twoim backendzie działa w przeglądarce; `npm run test` i `npm run build` przechodzą po dostrojeniu FE.
- Od etapu 4 zielony CI, od etapu 5 to samo na `dev` w Azure.

## Pierwszy krok

Przeklikaj aplikację i spisz funkcje związane z kontem i społecznością z decyzją „zostaje / wyrzucam / zmieniam”. To będzie pierwszy PR do review.
