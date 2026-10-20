---
name: profil-odczytu-mapy
description: Dodaje albo poprawia profil odczytu map przez AI w tej aplikacji (src/shared/lib/history/readProfiles.ts). Użyj, gdy aplikacja ma czytać nowy rodzaj mapy historycznej (katastralna, Urmesstischblatt, austriacka, rosyjska trzywiorstówka itp.) albo lepiej czytać istniejący (topo, wojskowa).
---

# Profil odczytu mapy

Profil to „umiejętność” odczytu jednego rodzaju mapy: prompt z legendą, schemat JSON odpowiedzi,
najgrubsza skala i limit długości. Jest wspólny dla aplikacji i workera (`server/`). Opis i stan:
`docs/BACKEND.md`, sekcja „Profile odczytu”.

## 1. Zbierz wiedzę o mapie

- Legenda serii (Zeichenerklärung, objaśnienia znaków): jakie znaki, skróty i kolory oznaczają
  obiekty warte kontekstu. Wypisz je z przykładami skrótów (np. „Wm.” = Wassermühle).
- Skala i rozmiar znaków: od tego zależy `maxResM` (metrów na piksel, przy których znak ma jeszcze
  kilka pikseli). Największy czytany widok to `maxResM × 1568 px`.
- Poproś użytkownika o 1–3 wycinki tej mapy. Trzymaj je w `data/` i nigdy ich nie commituj.

## 2. Kod

1. Rodzaje obiektów: nowa stała w `src/shared/lib/history/types.ts` (jak `MILITARY_OBJECT_KINDS`),
   dopisana do typu `ReadKind`. Nie zmieniaj `MAP_OBJECT_KINDS` ani domyślnego `parseMapObjects`:
   używa ich potok zgłoszeń drugiej sesji (`server/src/pipeline/*`).
2. Prompt i schemat: nowy plik `<nazwa>Prompt.ts` wzorem `militaryPrompt.ts`. Structured output:
   każde pole `required`, `additionalProperties: false`, bez `minimum`/`maximum`; obiekty liniowe
   jako `line` (lista punktów, pusta dla punktów). Prompt po angielsku, z rozmiarem obrazu i skalą.
3. Wpis w `READ_PROFILES` (`readProfiles.ts`): `kinds`, `schema`, `prompt`, `maxResM`, `maxTokens`.
   Nowe id dopisz do `ReadProfileId`.
4. Propozycje: istniejący `buildProposals` (porównanie z BDOT10k) albo własny `build…Proposals`
   wzorem `buildMilitaryProposals`. Nowy `ContextKind` tylko przy nowym zachowaniu w analizie; wtedy
   także `shared/types/domain.ts`, `docs/PLAN.md`, `history/config/contextKinds.ts`,
   `importContextGeoJSON.ts`, `interpretConfig.contextKindRadiusM`, `CommunityKind`, serwerowe `KINDS`
   i migracja D1 przebudowująca CHECK (wzór: `server/migrations/0004_community_military_kinds.sql`,
   najpierw nowa tabela głosów, potem usunięcie starych, potem zmiana nazw).
5. Aplikacja: przełącznik w `AiReadingSection.tsx` (`data-tour="ai-profile"`), opis rodzaju mapy,
   notatka w `features/safety/config/legal.ts`, jeśli mapa niesie ryzyko (niewybuchy, groby),
   i tekst kroku przewodnika `ai-profile`.

## 3. Sprawdzenie

- Testy: `tests/lib/history/` (parsowanie, propozycje), `server/test/readings.test.ts` (profil
  wysyła swój prompt, schemat i limit). Potem `npm run test`, `npm run lint`, `npm run build`, a w
  `server/`: `npm test`, `npm run typecheck` i typecheck bez głównego `node_modules` (serwer importuje
  konkretne pliki, nigdy barrela `@/shared/lib/history`).
- Na prawdziwym wycinku: odczyt członkiem społeczności w aplikacji, porównanie wyniku z mapą,
  poprawa promptu (konkretne znaki i skróty, czego nie zgłaszać), powtórka. Wnioski dopisz do
  `docs/BACKEND.md`.
- Koszt: domyślnie Haiku; Sonnet tylko gdy Haiku nie czyta znaków (ok. 20 razy drożej).

## Zasady

- Do bazy trafia tylko kontekst z map, nigdy znaleziska ani stanowiska.
- Ryzyko na mapie (pozycje, pola minowe, mogiły) daje ostrzeżenia i ochronę jak w profilu wojskowym
  (`shared/lib/detect/militaryNearby.ts`), nigdy nie podnosi oceny miejsca przy mogile.
- Interfejs po polsku, bez długich myślników.
