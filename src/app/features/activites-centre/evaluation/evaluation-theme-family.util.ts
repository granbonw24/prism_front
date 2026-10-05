/** Thème d’évaluation : polarité (sait / ne sait pas) et famille (lire, écrire…). */

export type EvaluationThemeMeta = {
  libelle?: string | null;
  code?: string | null;
};

export type EvaluationThemeCounts = {
  nombreTotalEvalue: number | null;
  nombreResultatObtenu: number | null;
  taux: number | null;
};

export type EvaluationThemeFamily<T> = {
  id: string;
  title: string;
  paired: boolean;
  positive: T | null;
  negative: T | null;
};

export function normalizeEvaluationThemeLabel(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '');
}

export function evaluationThemeToken(meta: EvaluationThemeMeta): string {
  const fromLibelle = normalizeEvaluationThemeLabel(meta.libelle);
  if (fromLibelle) {
    return fromLibelle;
  }
  return normalizeEvaluationThemeLabel(meta.code).replace(/^TEV_(N1|N2|PA)_/, '');
}

export function isComplementaryEvaluationTheme(meta: EvaluationThemeMeta): boolean {
  return evaluationThemeToken(meta).startsWith('NE_');
}

export function evaluationThemeFamilyKey(meta: EvaluationThemeMeta): string {
  let token = evaluationThemeToken(meta);
  if (token.startsWith('NE_')) {
    token = token.slice(3).replace('_PAS_', '_');
  }
  return token;
}

export function evaluationThemeFamilyTitle(positiveLibelle: string | null | undefined, familyKey: string): string {
  const raw = (positiveLibelle ?? '').trim();
  const match = raw.match(/^Sait\s+(.+)$/i);
  if (match?.[1]) {
    const rest = match[1].trim();
    return rest.charAt(0).toUpperCase() + rest.slice(1);
  }
  if (raw) {
    return raw;
  }
  return familyKey.replace(/_/g, ' ').toLowerCase();
}

export function groupEvaluationThemesByFamily<T>(
  items: T[],
  metaOf: (item: T) => EvaluationThemeMeta,
): EvaluationThemeFamily<T>[] {
  const families = new Map<string, EvaluationThemeFamily<T>>();
  const order: string[] = [];

  for (const item of items) {
    const meta = metaOf(item);
    const id = evaluationThemeFamilyKey(meta);
    let family = families.get(id);
    if (!family) {
      family = { id, title: id, paired: false, positive: null, negative: null };
      families.set(id, family);
      order.push(id);
    }
    if (isComplementaryEvaluationTheme(meta)) {
      if (family.negative == null) {
        family.negative = item;
      }
    } else if (family.positive == null) {
      family.positive = item;
      family.title = evaluationThemeFamilyTitle(meta.libelle, id);
    }
  }

  return order.map((id) => {
    const family = families.get(id)!;
    family.paired = family.positive != null && family.negative != null;
    if (!family.positive && family.negative) {
      family.title = evaluationThemeFamilyTitle(metaOf(family.negative).libelle, id);
    }
    return family;
  });
}

export function deduceComplementaryCounts(
  positive: EvaluationThemeCounts,
  negative: EvaluationThemeCounts,
): void {
  negative.nombreTotalEvalue = positive.nombreTotalEvalue;
  if (positive.nombreTotalEvalue == null || positive.nombreResultatObtenu == null) {
    negative.nombreResultatObtenu = null;
    negative.taux = null;
    return;
  }
  const total = positive.nombreTotalEvalue;
  const obtenu = Math.min(Math.max(positive.nombreResultatObtenu, 0), total);
  positive.nombreResultatObtenu = obtenu;
  negative.nombreResultatObtenu = Math.max(0, total - obtenu);
  assignTaux(positive);
  assignTaux(negative);
}

function assignTaux(item: EvaluationThemeCounts): void {
  const total = item.nombreTotalEvalue;
  const obtenu = item.nombreResultatObtenu;
  if (total == null || total <= 0 || obtenu == null) {
    return;
  }
  item.taux = Math.round((100 * obtenu) / total);
}
