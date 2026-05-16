export type MenaSelectOption<V = number | string | boolean | null> = {
  value: V;
  label: string;
};

const frCollator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true });

export function compareLabelsAlphabetically(a: string, b: string): number {
  return frCollator.compare(a.trim(), b.trim());
}

export function sortByLabel<T>(items: readonly T[], labelFn: (item: T) => string): T[] {
  return [...items].sort((a, b) => compareLabelsAlphabetically(labelFn(a), labelFn(b)));
}

export function toMenaSelectOptions<T, V extends number | string | boolean | null>(
  items: readonly T[],
  valueFn: (item: T) => V,
  labelFn: (item: T) => string,
): MenaSelectOption<V>[] {
  return sortByLabel(items, labelFn).map((item) => ({
    value: valueFn(item),
    label: labelFn(item),
  }));
}

export function toMenaSelectOptionsFromIds(
  items: readonly { id: number }[],
  labelFn: (item: { id: number }) => string,
): MenaSelectOption<number>[] {
  return toMenaSelectOptions(items, (item) => item.id, labelFn);
}

export function toMenaSelectOptionsFromPairs(
  items: readonly { value: string | number; label: string }[],
): MenaSelectOption<string | number>[] {
  return sortByLabel([...items], (item) => item.label).map((item) => ({
    value: item.value,
    label: item.label,
  }));
}

/** Libellé référentiel : libelle*, code*, sinon #id. */
export function refEntityLabel(
  item: Record<string, unknown>,
  libelleKeys: string[],
  codeKeys: string[] = [],
): string {
  for (const key of libelleKeys) {
    const v = item[key];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  for (const key of codeKeys) {
    const v = item[key];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  const id = item['id'];
  if (typeof id === 'number') {
    return `#${id}`;
  }
  return '—';
}
