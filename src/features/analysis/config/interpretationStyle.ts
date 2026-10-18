import type { Interpretation, Priority } from '@/shared/types/domain';

/** Map and list colour by priority. */
export const PRIORITY_COLOR: Record<Priority, string> = {
  najwyzszy: '#dc2626',
  wysoki: '#ea580c',
  sredni: '#ca8a04',
  niski: '#2563eb',
  chroniony: '#9ca3af',
  naturalne: '#65a30d',
};

export const INTERPRETATION_STYLE: Record<Interpretation, { icon: string; hint: string }> = {
  zaginiona_osada: { icon: 'home', hint: 'platformy i piwniczki dawnych zabudowań' },
  oboz: { icon: 'campground', hint: 'zespół podobnych ziemianek blisko wody' },
  ziemianka: { icon: 'archway', hint: 'prostokątny dół z płaskim dnem' },
  okop: { icon: 'grip-lines', hint: 'rów z zygzakiem i wałem przedpiersia' },
  stanowiska_strzeleckie: { icon: 'crosshairs', hint: 'doły w linii z hałdą po jednej stronie' },
  stanowisko_sprzetu: { icon: 'truck', hint: 'wał w kształcie podkowy' },
  leje: { icon: 'bullseye', hint: 'lej z wałem dookoła' },
  dawna_droga: { icon: 'road', hint: 'wcięcie drogi, często kilka równoległych' },
  pola_dawne: { icon: 'seedling', hint: 'równoległe garby dawnych zagonów' },
  mielerz: { icon: 'fire-alt', hint: 'płaska platforma po wypalaniu węgla drzewnego' },
  wyrobisko: { icon: 'hard-hat', hint: 'nieregularny dół z hałdami' },
  row_melioracyjny_graniczny: { icon: 'water', hint: 'prosty rów ze stałym spadkiem' },
  kurhan: { icon: 'monument', hint: 'kopuła grobowa, zabytek' },
  grodzisko_waly: { icon: 'chess-rook', hint: 'wał pierścieniowy, zabytek' },
  wykrot: { icon: 'tree', hint: 'dół po wywróconym drzewie z kopcem obok' },
  naturalna_inna: { icon: 'mountain', hint: 'wydma, rynna, osuwisko, rozcięcie' },
  nieokreslona: { icon: 'question-circle', hint: 'forma bez wyraźnych cech' },
};

export const PROTECTED_MESSAGE =
  'Prawdopodobnie stanowisko archeologiczne, nie może być celem poszukiwań. ' +
  'Jeśli to nieznane stanowisko, zgłoś je wojewódzkiemu konserwatorowi zabytków.';
