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

/** Libellé pour listes déroulantes : libellé métier uniquement (pas de code). */
export function libelleOrId(
  libelle: string | null | undefined,
  id: number | string | null | undefined,
  empty = '—',
): string {
  const l = libelle?.trim();
  if (l) {
    return l;
  }
  if (id != null && String(id).trim() !== '') {
    return `#${id}`;
  }
  return empty;
}

function isCodeOrIdKey(key: string): boolean {
  return key === 'id' || key === 'code' || /^code[A-Z_]/i.test(key);
}

/**
 * Libellé d’un référentiel pour les selects (sans repli sur les champs code).
 */
export function refEntityLabelForSelect(
  item: Record<string, unknown>,
  libelleKeys: string[] = [],
): string {
  const debut = stringField(item['debutAnneeScolaire']);
  const fin = stringField(item['finAnneeScolaire']);
  if (debut && fin) {
    const y1 = extractYearLabel(debut);
    const y2 = extractYearLabel(fin);
    if (y1 && y2) {
      return `${y1} – ${y2}`;
    }
  }

  const libKeys = dedupeKeys(['libelle', ...libelleKeys]).filter((k) => !isCodeOrIdKey(k));

  for (const key of libKeys) {
    const label = stringField(item[key]);
    if (label) {
      return label;
    }
  }

  for (const key of Object.keys(item)) {
    if (!/^(libelle|nom|label)/i.test(key)) {
      continue;
    }
    const label = stringField(item[key]);
    if (label) {
      return label;
    }
  }

  const id = item['id'];
  if (typeof id === 'number') {
    return `#${id}`;
  }
  if (typeof id === 'string' && id.trim()) {
    return `#${id.trim()}`;
  }
  return '—';
}

/**
 * Libellé d’un référentiel API (affichage détail / tableaux : peut inclure le code).
 * Gère le format enrichi `{ id, code, libelle }` (ReferentielEnricher.toRef)
 * et les champs métier (`libelleCivilite`, `codeFonction`, etc.).
 */
export function refEntityLabel(
  item: Record<string, unknown>,
  libelleKeys: string[],
  codeKeys: string[] = [],
): string {
  const libKeys = dedupeKeys(['libelle', ...libelleKeys]);
  const codKeys = dedupeKeys(['code', ...codeKeys]);

  for (const key of libKeys) {
    const label = stringField(item[key]);
    if (label) {
      return label;
    }
  }
  for (const key of codKeys) {
    const label = stringField(item[key]);
    if (label) {
      return label;
    }
  }

  for (const key of Object.keys(item)) {
    if (!/^(libelle|nom|label)/i.test(key)) {
      continue;
    }
    const label = stringField(item[key]);
    if (label) {
      return label;
    }
  }

  const id = item['id'];
  if (typeof id === 'number') {
    return `#${id}`;
  }
  if (typeof id === 'string' && id.trim()) {
    return `#${id.trim()}`;
  }
  return '—';
}

function dedupeKeys(keys: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of keys) {
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

function stringField(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractYearLabel(value: string): string | null {
  const match = value.match(/\d{4}/);
  return match?.[0] ?? null;
}
