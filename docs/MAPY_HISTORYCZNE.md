# Mapy historyczne: źródła

Rozpoznanie z 18.10.2026 (krok 0 planu map historycznych). Sprawdzone zapytaniami
GetCapabilities i GetMap lub pobraniem kafelków, z obejrzeniem obrazów.

## Usługi sprawdzone

| Źródło | Usługa | Warstwy | Układ, zoom | Zasięg | CORS | Warunki |
|---|---|---|---|---|---|---|
| **Mapy z przeszłością (IH PAN, CeNaGIS)** | WMS 1.3.0 `https://pastmaps.cenagis.edu.pl/geoserver/ihpan/wms` | `wig25k_3857`, `wig100k_3857`, `wig300k_3857`, `wig_1947_1952_3857`, `m25k_3857` (Messtischblatt), `kdr_3857` (KdDR 1:100k), `kdwr_3857`, `dwuwiorstowka_3857` (1:84k), `kummersberg_3857` (Galicja 1855), `TKKP_126k_3857`, `reymann_3857`; są też warianty `_2180` i `_4326` | EPSG:3857 natywnie; 1:25k do z16–17, 1:100k do z14–15 | WIG i KdDR cała Polska; Messtischblatt dawne ziemie niemieckie | tak | „Please contact us in case of an external WebGIS usage”, bez opłat. Skany z Mapster (tylko niekomercyjnie). **Przed udostępnieniem w aplikacji napisać do IH PAN. Brak zgody na pobieranie offline.** WMTS bez warstw. |
| **GUGiK, ortofotomapy archiwalne** (1995–dziś) | WMS 1.3.0 `https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolutionTime` | `Raster` z wymiarem `TIME`, np. `TIME=2004-01-01/2004-12-31` | EPSG:3857 działa (choć nie jest w capabilities); do z18–19 | cała Polska | tak | Bez opłat, „z wyłączeniem automatycznego pobierania i kolekcjonowania obrazów (harvesting)”. **Tylko online.** Offline: GeoTIFF z PZGiK i import własny. |
| GUGiK, roczniki zdjęć | WMS `.../PZGIK/ORTO/WMS/SkorowidzeWgAktualnosci` | `SkorowidzeOrtofotomapy2024/2025/2026/Starsze` | | cała Polska | tak | jak wyżej; pokazuje, z jakich lat są zdjęcia |
| **SLUB Kartenforum, KdDR 1:100k** (1898–1920) | WMS `https://wms.kartenforum.slub-dresden.de/map/deutsches_reich_tk100` | `deutsches_reich_tk100` | EPSG:3857 | dawne Niemcy | `*` | mapy sprzed 1900 CC BY-SA 4.0, nowsze „rights reserved” |
| **SLUB Kartenforum, arkusze Messtischblatt** (ok. 1900 arkuszy, głównie 1933–42) | TMS na arkusz `https://tms-{1,2}.kartenforum.slub-dresden.de/mtb/{plik}/{z}/{x}/{y}.png` (oś y odwrócona, w Leaflet `tms: true`, do z16); wyszukiwanie `POST https://search.kartenforum.slub-dresden.de/vk20/_search` (`map_type:"mtb"`, `has_georeference:true`, `geo_shape`) | | EPSG:3857 | dawne Niemcy | `*` | jak wyżej; offline tylko za zgodą SLUB |

## Sprawdzone, nie nadają się

- **Mapster (AMZP)**: z zagranicznego IP połączenie zrywane. Przeglądarka i archiwum skanów, bez WMS ani XYZ. „Udostępniane do użytku niekomercyjnego”. Georeferencjonowane wersje serwuje IH PAN.
- **Arcanum / Mapire** (Galicja, II zdjęcie wojskowe): płatne, kafelki 403.
- **data.atlasfontium.pl**: głównie wektory atlasu historycznego, brak CORS.
- **GUGiK mapy topograficzne układ 1942 i 1965**: brak usługi przeglądania, tylko skorowidze (`.../pub/guest/G2_SKOROWIDZE_TOPO/MapServer/WMSServer`); skany do pobrania z PZGiK jako GeoTIFF, więc przez import własny.
- **Polona, David Rumsey, Archiwum Map WIG**: skany bez georeferencji, do importu i dopasowania w aplikacji.

## Do sprawdzenia

- Geoportale wojewódzkie (śląskie, dolnośląskie, pomorskie, warmińsko-mazurskie, kujawsko-pomorskie, lubuskie, zachodniopomorskie, małopolskie, lubelskie, podkarpackie).
- Mapy rosyjskie 1:42k i austriacka Spezialkarte 1:75 000 dla Galicji: nie znaleziono otwartej usługi.

## Skorowidze arkuszy

Krawędzie są w dawnym układzie odniesienia danej serii (Bessel/DHDN, Hermannskogel, rosyjskie).
Na WGS84 siatka może być przesunięta o kilkadziesiąt do ponad 100 m, więc narożniki z wzoru to
punkt startowy, a nie wynik dopasowania. Ferro = 17°40′ W od Greenwich (konwencja niemiecka).

| Seria | Arkusz | Wzór (Greenwich) | Stan |
|---|---|---|---|
| Messtischblatt / TK25, nowy numer `RRCC` | 10′ × 6′ | N = 56° − R·6′, W = 5°40′ + C·10′ | sprawdzony: 4868 Breslau (Nord), 4968, 4438, 5818 |
| Messtischblatt, stare numery pruskie (1 do ok. 3700) | | brak wzoru, potrzebna tabela stary → nowy | pary: 2565=4470, 3137=5368, 2824=4864, 2828=4868, 3387=5875, 2766=4767, 3248=5569, 3315=5706, 1157=2561 |
| WIG 1:100k, Pas P / Słup S | 30′ × 15′ | N = 62°15′ − P·15′, W = 4°50′ + S·30′ | sprawdzony na 7 arkuszach (np. P47 S40 Beresteczko). Wczesne arkusze wschodnie z lat 20. bywają przesunięte o pół arkusza. |
| WIG 1:25k „normalna”, np. `P46-S34-E` | 10′ × 5′ | arkusz 100k dzielony 3×3, litery A–I wierszami od NW: N = N₁₀₀ − wiersz·5′, W = W₁₀₀ + kolumna·10′ | geometria ze źródeł, kolejność liter wywnioskowana, sprawdzona na 2 arkuszach |
| KdDR 1:100k (numery 1–674) | 30′ × 15′ | ta sama siatka co WIG 1:100k; numer → położenie z tabeli | siatka sprawdzona (70 Danzig = P31 S27) |
| Spezialkarte 1:75k, Zone Z / Kolonne K | 30′ × 15′ | N = 51°15′ − (Z − 1)·15′, W = 9°20′ + (K − 1)·30′; czyli P = Z + 43, S = K + 8 | sprawdzony: Z5 K XXIV Tarnów, Z6 K XXII Wieliczka |
| Dwuwiorstówka 1:84k, np. `XX-10` | 27′ × 15′ | N = 58° − R·15′, W = 30,32736° + (C − 30)·0,45° (od Pułkowa) | sprawdzony na 3 arkuszach |
| Jednowiorstówka 1:42k, trzywiorstówka 1:126k, WIG 1:50k i 1:300k | | brak wzoru (1:126k w odwzorowaniu Bonne'a, tylko tabela) | otwarte |

Źródła: RCIN, Biblioteka Cyfrowa (tytuły „Neue Nr”), mapywig.org, T. Panecki, *Problem kalibracji
mapy szczegółowej Polski 1:25 000 WIG* (PPK 2014), OSM wiki (siatka MTB).

## Wnioski dla aplikacji

1. Warstwy historyczne wyłącznie online. Żadne z otwartych źródeł nie pozwala na zbiorcze pobieranie
   kafelków, więc nie trafiają do `planAreaTiles`. Offline: import własnych GeoTIFF (np. z PZGiK).
2. Domyślny zestaw: IH PAN (WIG 25k i 100k, Messtischblatt, KdDR, dwuwiorstówka, Kummersberg) oraz
   ortofotomapy archiwalne GUGiK z wyborem roku. Przed publikacją aplikacji: zgoda IH PAN.
3. SLUB jako opcja dla ostrzejszych arkuszy Messtischblatt na dawnych ziemiach niemieckich.
4. W aplikacji przy każdej warstwie: atrybucja, rok, link do warunków.
