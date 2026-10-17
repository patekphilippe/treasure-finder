import type { FormClass } from '@/shared/types/domain';

export interface FormMeta {
  label: string;
  /** what it may be in the field */
  hint: string;
  icon: string;
  /** same colours as the QGIS project (qgis/build_project.py) */
  color: string;
}

export const FORM_META: Record<FormClass, FormMeta> = {
  kopiec_okragly: {
    label: 'Kopiec okrągły',
    hint: 'kurhan, mielerz, kopiec graniczny',
    icon: 'mountain',
    color: '#d97706',
  },
  zaglebienie_okragle: {
    label: 'Zagłębienie okrągłe',
    hint: 'lej po bombie lub pocisku, jama, wyrobisko',
    icon: 'dot-circle',
    color: '#2563eb',
  },
  zaglebienie_prostokatne: {
    label: 'Zagłębienie prostokątne',
    hint: 'ziemianka, piwnica, zarys budynku',
    icon: 'square',
    color: '#7c3aed',
  },
  row_liniowy: {
    label: 'Rów liniowy',
    hint: 'okop, rów graniczny, wąwóz drogowy',
    icon: 'grip-lines',
    color: '#0891b2',
  },
  wal_liniowy: {
    label: 'Wał liniowy',
    hint: 'wał, miedza, nasyp drogi',
    icon: 'grip-lines-vertical',
    color: '#65a30d',
  },
  pierscien: { label: 'Pierścień', hint: 'grodzisko, szaniec', icon: 'ring', color: '#dc2626' },
  nieokreslony: {
    label: 'Nieokreślony',
    hint: 'forma bez wyraźnego kształtu',
    icon: 'question-circle',
    color: '#71717a',
  },
};

export const PROTECTED_COLOR = '#9ca3af';

export const PROTECTED_MESSAGE =
  'Prawdopodobnie stanowisko archeologiczne, nie może być celem poszukiwań. ' +
  'Jeśli to nieznane stanowisko, zgłoś je wojewódzkiemu konserwatorowi zabytków.';
