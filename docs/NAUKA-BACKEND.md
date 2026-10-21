# Plan nauki: backend w FastAPI + DevOps na Azure (na projekcie Treasure Finder)

## Kontekst

Chcesz nauczyć się backendu i DevOps na prawdziwym projekcie. Docelowo nowy backend w Pythonie
(FastAPI) ma zastąpić obecny Cloudflare Worker (`server/`, TypeScript), a działać ma na Azure.
**Ty piszesz kod.** Ja jestem mentorem: tłumaczę pojęcia, daję wskazówki i pytania naprowadzające,
robię code review Twoich commitów/PR, pomagam przy błędach. Gotowe rozwiązanie daję tylko, gdy
o nie wprost poprosisz (np. „pokaż”). Python odświeżamy po drodze, nie osobnym kursem.

Co dziś robi Worker (to jest „specyfikacja” do przepisania, opis w `docs/BACKEND.md`):

| Obszar | Endpointy | Dziś (Cloudflare) | Na Azure |
|---|---|---|---|
| Zdrowie | `/api/health` | Worker | Container Apps |
| Logowanie | `/api/auth/check` (JWT z Auth0) | `server/src/auth/` | to samo Auth0, weryfikacja JWT w Pythonie |
| Społeczność | `/api/community/` (obiekty, głosy, członkowie, mapy) | D1 (SQLite) | PostgreSQL (+ PostGIS później) |
| Wspólne mapy | `/api/community/maps` | R2 + D1 | Blob Storage + Postgres |
| Odczyt AI | `/api/readings` | Anthropic API, budżet, limity | to samo, SDK `anthropic` w Pythonie |
| Zgłoszenia | `/api/submissions` + cron | KV + D1 + Cron | Blob + Postgres + Container Apps Job |
| Umieszczanie | `/api/placements` | AI + siatka arkuszy | to samo |
| Cieniowanie | `/api/relief/1/{z}/{x}/{y}` | liczenie kafelków z NMT, R2 | numpy + Blob |
| Panel | `/api/admin/` | Worker | FastAPI |

Schemat bazy do przeniesienia: `server/migrations/0001…0008_*.sql`. Kontrakt (kształty JSON):
`src/shared/types/` (`community.ts`, `readings.ts`, `placement.ts`, `sources.ts`) i testy w `server/test/`.

## Zasady współpracy

- Nowy kod w `backend/` (Python), obok `server/`. Worker działa do dnia przełączenia — aplikacja nic nie traci w trakcie nauki.
- Każdy etap = osobna gałąź i PR. Ty piszesz, ja robię review (komentarze, pytania „a co, jeśli…”).
- Jeden etap kończy się tylko, gdy: testy `pytest` przechodzą, `ruff` i `mypy` czyste, umiesz wytłumaczyć, co napisałeś.
- Klucz Anthropic i inne sekrety tylko w Key Vault / sekretach, nigdy w repo (tak jak dziś).
- Zero telemetrii użytkowników: logi serwera tak, śledzenie ludzi nie.

## Etapy

### 0. Warsztat (1 tydzień)
Nauczysz się: Python 3.12, `uv` (środowiska, zależności), git na gałęziach, struktura projektu.
Zadanie: `backend/` z `pyproject.toml`, `ruff`, `mypy`, `pytest`; pierwszy test, który przechodzi.
Wskazówka na start: przeczytaj `docs/BACKEND.md` i spisz własnymi słowami, co robi każdy endpoint.

### 1. Pierwsze API (1–2 tyg.)
Nauczysz się: HTTP (metody, statusy, nagłówki, CORS), FastAPI, Pydantic, testy przez `TestClient`.
Zadanie: `/api/health`, konfiguracja z env (`pydantic-settings`, odpowiednik `[vars]` z `wrangler.toml`), CORS jak w `ALLOWED_ORIGINS`.

### 2. Baza danych (2–3 tyg.)
Nauczysz się: SQL, relacje, indeksy, transakcje, migracje; PostgreSQL w Dockerze (`docker compose`); SQLAlchemy 2 + Alembic.
Zadanie: przenieś schemat z `server/migrations/*.sql` do migracji Alembic (zastanów się, co się zmienia SQLite → Postgres: typy, `INTEGER` jako bool, czasy).

### 3. Logowanie i uprawnienia (1–2 tyg.)
Nauczysz się: OAuth/OIDC, JWT, JWKS, zależności (`Depends`) w FastAPI, 401 vs 403.
Zadanie: weryfikacja tokenu Auth0 (porównaj z `server/src/auth/jwt.ts`), `/api/auth/check`, rola właściciela (`ADMIN_EMAILS`).

### 4. Społeczność (2–3 tyg.) — pierwszy „prawdziwy” moduł
Zadanie: obiekty, głosy, limity dzienne, paczki do 1000, przesunięcia, usuwanie (`server/src/community/`).
Nauczysz się: walidacja wejścia, limity nadużyć, zapytania po obszarze (bbox), testy integracyjne na prawdziwym Postgresie.

### 5. Docker i CI (1 tydz.)
Nauczysz się: Dockerfile (wieloetapowy, mały obraz), GitHub Actions: lint + testy + build obrazu przy każdym PR.
Zadanie: `backend/Dockerfile`, workflow `.github/workflows/backend.yml` (wzór: istniejący `server.yml`).

### 6. Azure — pierwsze wdrożenie (2 tyg.)
Nauczysz się: chmura od podstaw: subskrypcja, grupa zasobów, regiony, koszty i alerty budżetu.
Usługi: **Azure Container Apps** (API, skaluje do zera), **Azure Container Registry** (obrazy), **Azure Database for PostgreSQL Flexible Server**, **Key Vault** (sekrety), **Managed Identity** (bez haseł między usługami).
Infrastruktura jako kod: **Bicep** (`backend/infra/`), wdrożenie z GitHub Actions przez **OIDC** (bez kluczy w sekretach GitHuba).
Zadanie: środowisko `dev` na Azure, które samo się wdraża po merge'u.
Koszty: jeśli jesteś uczniem/studentem — **Azure for Students** (kredyt bez karty); i tak ustaw alert budżetu od pierwszego dnia.

### 7. Pliki: wspólne mapy (1–2 tyg.)
Nauczysz się: Blob Storage, SAS / Managed Identity, przesyłanie dużych plików, strumieniowanie.
Zadanie: `/api/community/maps` (odpowiednik R2 `mapy/<id>`).

### 8. AI na backendzie (2–3 tyg.)
Nauczysz się: Anthropic API w Pythonie (wiadomości z obrazem, wyjście w schemacie, Batch API), liczenie kosztów, budżet miesięczny, limity.
Zadanie: `/api/readings` i `/api/placements` (profile odczytu są w `src/shared/lib/history/readProfiles.ts` — trzeba je współdzielić, np. eksport do JSON przy buildzie).

### 9. Zadania w tle (1–2 tyg.)
Nauczysz się: kolejki, zadania cykliczne, blokady, idempotencja.
Zadanie: potok zgłoszeń (`server/src/pipeline/`) jako **Container Apps Job** (cron) albo kolejka (Storage Queue).

### 10. Cieniowanie NMT (2 tyg., najtrudniejsze obliczeniowo)
Nauczysz się: numpy, rastry, kodowanie PNG/JPEG, cache.
Zadanie: `/api/relief/...` (wzór: `server/src/relief/shadeTile.ts`), kafelki w Blob, przed nimi CDN (Azure Front Door) — opcjonalnie.

### 11. Produkcja i przełączenie (1–2 tyg.)
Nauczysz się: środowiska dev/prod, migracja danych D1 → Postgres (skrypt), backupy i odtwarzanie, logi (Log Analytics), health checki, rollback.
Zadanie: eksport danych z D1, import, testy kontraktu przeciw obu backendom, zmiana adresu w `src/shared/config/backend.ts` i routingu `/api/*`, aktualizacja `docs/BACKEND.md` i `CLAUDE.md`. Worker zostaje wyłączony dopiero po tygodniu spokoju.

## Agenci AI pod projekt (równolegle, od etapu 2)

- Claude Code w repo: własny **subagent** do review backendu (`.claude/agents/backend-reviewer.md`), **skill** „nowy endpoint” (checklista: model Pydantic, test, migracja, dokumentacja), **hook** uruchamiający `ruff`/`pytest` po edycji. Uczysz się pisać instrukcje i ograniczać narzędzia agenta.
- W etapie 8: agent w samym backendzie — odczyt mapy jako pętla narzędzi (Anthropic SDK, tool use) zamiast jednego zapytania; porównasz koszt i jakość z obecnym podejściem.

## Szacunkowo

~4–6 miesięcy przy kilku godzinach tygodniowo. Najważniejsze kamienie: etap 4 (działa coś prawdziwego lokalnie), etap 6 (działa w chmurze), etap 11 (zastępuje Workera).

## Weryfikacja (dla każdego etapu)

- `cd backend && uv run pytest && uv run ruff check && uv run mypy .`
- Od etapu 5: zielony CI w PR.
- Od etapu 6: `curl https://<dev>.azurecontainerapps.io/api/health`, a dla modułów — aplikacja (`npm run dev`) z adresem backendu ustawionym na dev Azure i ręczny test w przeglądarce.
- Przed przełączeniem: te same testy kontraktu przechodzą dla Workera i dla FastAPI.

## Pierwszy krok

Zaczynasz etap 0: instalujesz `uv`, tworzysz `backend/`, a ja tłumaczę każdy plik, który zakładasz, i robię review pierwszego PR.
