import {
  MenaSelectOption,
  sortByLabel,
  toMenaSelectOptions,
} from '@shared/mena-searchable-select/mena-select-options.util';

export type ActivitesRef = {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
  [key: string]: unknown;
};

const LIBELLE_KEYS = [
  'libelle',
  'libelleNiveauAlpha',
  'libellePeriodeActivite',
  'libellePeriodeEvaluation',
  'libelleNiveauEvaluation',
  'libelleNiveauControle',
] as const;

function pickString(ref: ActivitesRef, keys: readonly string[]): string {
  for (const key of keys) {
    const value = ref[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export function activitesRefLabel(ref: ActivitesRef | null | undefined): string {
  if (!ref) {
    return '—';
  }
  const libelle = pickString(ref, LIBELLE_KEYS);
  return libelle || (ref.id != null ? `#${ref.id}` : '—');
}

export function sortActivitesRefs<T extends ActivitesRef>(items: readonly T[]): T[] {
  return sortByLabel(items, (item) => activitesRefLabel(item));
}

export function menaActivitesRefOptions<V extends number | string | null>(
  items: readonly ActivitesRef[],
  valueFn: (item: ActivitesRef) => V,
): MenaSelectOption<V>[] {
  return toMenaSelectOptions(sortActivitesRefs(items), valueFn, activitesRefLabel);
}

export function menaActivitesRefOptionsWithAll<V extends number | string | null>(
  items: readonly ActivitesRef[],
  valueFn: (item: ActivitesRef) => V,
  allLabel: string,
  allValue: V,
): MenaSelectOption<V>[] {
  return [{ value: allValue, label: allLabel }, ...menaActivitesRefOptions(items, valueFn)];
}
