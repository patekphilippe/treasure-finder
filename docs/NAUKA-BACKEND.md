# Plan nauki: własny backend (FastAPI) pod istniejący frontend + DevOps na Azure

## Kontekst

Chcesz nauczyć się backendu i DevOps. Backend ma powstać **pod frontend**, nie jako przepisanie
Workera z `server/`. Punktem wyjścia jest to, czego aplikacja (FE) potrzebuje: jakie zapytania wysyła,
jakie dane chce dostać, co pokazuje użytkownikowi. Kodu `server/` nie czytasz: bazę, API
i architekturę projektujesz sam. Docelowo Twój backend zastępuje Workera: aplikacja przełącza się na
niego jedną zmienną `VITE_SOURCES_API_URL` (`src/shared/config/backend.ts`).

**Ty piszesz kod.** Ja jestem mentorem: tłumaczę, zadaję pytania naprowadzające, robię review PR,
pomagam przy błędach. Gotowe rozwiązanie daję tylko, gdy wprost poprosisz.

## Skąd brać wymagania (tylko z FE)

| Funkcja w aplikacji | Gdzie FE woła backend | Typy danych |
|---|---|---|
| Konto, kto jest zalogowany | `src/features/account/services/refreshAccount.ts`, `src/shared/auth/` | — |
| Wspólna baza obiektów, głosy | `src/features/history/services/communityApi.ts` | `src/shared/types/community.ts` |
| Wspólne mapy | `src/features/history/services/sharedMapsApi.ts` | |
| Odczyt mapy przez AI | `src/features/history/services/readMapWithAi.ts` | `src/shared/types/readings.ts` |
| Umieszczanie skanu | `src/features/history/services/placeOwnMap.ts` | `src/shared/types/placement.ts` |
| Zgłoszenia źródeł, panel admina | `src/features/sources/services/sourcesApi.ts`, `adminApi.ts` | `src/shared/types/sources.ts` |
| Cieniowanie terenu | `RELIEF_TILE_URL` w `src/shared/config/backend.ts` | kafelki PNG |

Dla każdej funkcji robisz to samo:
1. Klikasz funkcję w aplikacji (`npm run dev`) i patrzysz w DevTools → Network, co idzie i co wraca.
2. Czytasz plik `services/` i typy: spisujesz endpointy, dane wejścia/wyjścia, błędy, których FE się spodziewa.
3. **Sam piszesz** opis (OpenAPI / modele Pydantic) i projekt tabel, zanim napiszesz logikę. Ja to recenzuję.
4. Implementujesz, testujesz w `pytest`, potem uruchamiasz FE z `VITE_SOURCES_API_URL=http://localhost:8000` i sprawdzasz, że funkcja działa w aplikacji.

Gdy FE czegoś nie mówi (np. limity, kto może usuwać), to jest decyzja projektowa: proponujesz ją, a my ją omawiamy.
Wtedy wolno zajrzeć do `docs/BACKEND.md` po wymaganie biznesowe (nie po kod).

## Zasady współpracy

- Kod w `backend/`. Worker działa, póki Twój backend nie przejmie danej funkcji. Aplikacja nic nie traci.
- Każdy krok = gałąź + PR + moje review. Krok jest skończony, gdy przechodzą `pytest`, `ruff` i `mypy`,
  funkcja działa w prawdziwej aplikacji i umiesz wytłumaczyć swoje decyzje.
- Kontrakt z FE jest święty: jeśli chcesz go zmienić, to jest osobna zmiana w FE (z testami `npm run test`).
- Sekrety (klucz Anthropic, Auth0) tylko w Key Vault / `.env` poza repo. Bez telemetrii użytkowników.

## Etapy

### 0. Warsztat (1 tydz.)
Python 3.12, `uv`, `pytest`, `ruff`, `mypy`, git na gałęziach. Szkielet `backend/` z jednym testem.
Zadanie dodatkowe: przejdź po aplikacji z otwartym Network i spisz wszystkie zapytania do `/api/`.

### 1. Pierwsze API + spięcie z FE (1–2 tyg.)
HTTP, CORS, FastAPI, Pydantic, konfiguracja z env. `/api/health`, a potem FE uruchomione na Twój backend
(zobaczysz, które funkcje się psują; to Twoja lista zadań).

### 2. Logowanie (1–2 tyg.)
OAuth/OIDC, JWT, JWKS. FE już loguje przez Auth0 i wysyła token (`src/shared/auth/`). Ty go weryfikujesz
i odpowiadasz na sprawdzenie konta (`refreshAccount.ts`). Projektujesz: członkowie, zaproszenia, rola właściciela.

### 3. Baza i wspólna baza obiektów (3–4 tyg.)
SQL, PostgreSQL w Dockerze (`docker compose`), SQLAlchemy 2, Alembic, PostGIS do zapytań po obszarze.
Sam projektujesz tabele pod `communityApi.ts` i `community.ts`: obiekty, głosy, kto co może, limity.

### 4. Docker i CI (1 tydz.)
Dockerfile, GitHub Actions: lint + testy + obraz przy każdym PR (`.github/workflows/backend.yml`).

### 5. Azure (2 tyg.)
Container Apps (API), Container Registry, PostgreSQL Flexible Server, Key Vault, Managed Identity,
infrastruktura w Bicep (`backend/infra/`), wdrożenie z GitHub Actions przez OIDC. Środowisko `dev`.
Pierwszego dnia ustawiasz alert budżetu. Jeśli jesteś uczniem/studentem: Azure for Students.

### 6. Pliki: wspólne mapy (1–2 tyg.)
Blob Storage, wysyłanie dużych plików, uprawnienia. Pod `sharedMapsApi.ts`.

### 7. AI (2–3 tyg.)
Anthropic SDK w Pythonie: obraz, wynik w schemacie, koszty, budżet, limity dzienne. Pod `readMapWithAi.ts`
i `placeOwnMap.ts`. Profile odczytu są w `src/shared/lib/history/readProfiles.ts` (FE i backend muszą mieć te same):
sam zaprojektujesz, jak je współdzielić (np. eksport do JSON przy buildzie).

### 8. Zadania w tle (1–2 tyg.)
Zgłoszenia źródeł (`sourcesApi.ts`) i panel (`adminApi.ts`): FE wysyła i odpytuje status, więc potrzebujesz
kolejki i zadania cyklicznego (Container Apps Job / Storage Queue). Idempotencja, blokady.

### 9. Cieniowanie terenu (2 tyg.)
numpy, rastry, PNG, cache w Blob. Pod `RELIEF_TILE_URL`.

### 10. Produkcja i przełączenie (1–2 tyg.)
Środowiska dev/prod, backupy, logi, health checki, rollback. Przeniesienie istniejących danych społeczności
(eksport z obecnej bazy, Twój skrypt importu). Zmiana adresu w `backend.ts`, aktualizacja `docs/BACKEND.md` i `CLAUDE.md`.

## Agenci AI pod projekt (równolegle, od etapu 2)

- Claude Code w repo: subagent do review backendu (`.claude/agents/backend-reviewer.md`), skill „nowy endpoint”
  (kontrakt z FE → model → test → migracja → dokumentacja), hook z `ruff`/`pytest` po edycji.
- W etapie 7: agent w backendzie (tool use) do odczytu map; porównasz koszt i jakość z jednym zapytaniem.

## Weryfikacja (każdy etap)

- `cd backend && uv run pytest && uv run ruff check && uv run mypy .`
- FE na Twoim backendzie: `VITE_SOURCES_API_URL=http://localhost:8000 npm run dev`, a funkcja z etapu działa w przeglądarce.
- Od etapu 4 zielony CI, od etapu 5 to samo na adresie `dev` w Azure.

## Pierwszy krok

Etap 0: instalujesz `uv`, zakładasz `backend/` i spisujesz zapytania z Network. Ja recenzuję pierwszy PR.
