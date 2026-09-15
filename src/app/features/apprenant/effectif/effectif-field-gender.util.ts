import type { ReferentielFormField } from '@core/config/referentiel-form.types';

/**
 * Genre d’une clé d’effectif (H / F).
 * Couvre les suffixes `…H` / `…F` / `…HCp` et les tokens `Garcon` / `Fille` au milieu
 * (`effectifCepeCandidatGarconCec`).
 */
export function effectifFieldGender(key: string): 'H' | 'F' | null {
  if (!key) {
    return null;
  }
  if (/Homme|Garcon|Garçon/i.test(key)) {
    return 'H';
  }
  if (/Femme|Fille/i.test(key)) {
    return 'F';
  }
  if (/NiveauH$/i.test(key) || /(?:^|[a-z0-9])H(?:Cp|Cec|Sie)?$/i.test(key)) {
    return 'H';
  }
  if (/NiveauF$/i.test(key) || /alphaNiveauFemme$/i.test(key) || /(?:^|[a-z0-9])F(?:Cp|Cec|Sie)?$/i.test(key)) {
    return 'F';
  }
  return null;
}

/**
 * Rubrique qui entre dans la somme H/F vs totaux.
 *
 * Sur un formulaire CEPE (candidats + admis), seuls les candidats H/F « principaux »
 * partitionnent l’effectif total. Handicap, ivoiriens et admis sont des sous-ensembles
 * (ne pas les additionner, sinon double compte).
 */
export function isEffectifGenderPartitionPart(
  field: Pick<ReferentielFormField, 'key'>,
  allFields: Array<Pick<ReferentielFormField, 'key'>>,
): boolean {
  const key = field.key ?? '';
  if (effectifFieldGender(key) == null) {
    return false;
  }
  if (isEffectifTotalKey(key)) {
    return false;
  }
  const keys = allFields.map((f) => f.key ?? '');
  const hasCandidatGender = allFields.some(
    (f) => /Candidat/i.test(f.key) && effectifFieldGender(f.key) != null && !/Handicap/i.test(f.key),
  );
  if (hasCandidatGender) {
    if (/Handicap|Ivoirien/i.test(key)) {
      return false;
    }
    if (/Admis/i.test(key) && !/Candidat/i.test(key)) {
      return false;
    }
    return /Candidat/i.test(key);
  }
  const hasAgeOnly = keys.some((k) => isAgeOnlyGenderKey(k, keys));
  if (hasAgeOnly) {
    return isAgeOnlyGenderKey(key, keys);
  }
  const hasNationality = keys.some(
    (k) =>
      effectifFieldGender(k) != null &&
      !isEffectifTotalKey(k) &&
      !/Handicap/i.test(k) &&
      /Ivoirien|NonIvoiri/i.test(k),
  );
  if (hasNationality) {
    return /Ivoirien|NonIvoiri/i.test(key) && !/Handicap/i.test(key);
  }
  return !/Handicap/i.test(key);
}

/** Totaux H/F (ou total unique legacy NiveauCec/Cp/Sie). */
export function isEffectifTotalKey(key: string): boolean {
  return /(NiveauHomme|NiveauFemme|NiveauH|NiveauF|alphaNiveauFemme)$/i.test(key) || /Niveau(Cec|Cp|Sie)$/i.test(key);
}

export function isEffectifSubsetField(
  field: Pick<ReferentielFormField, 'key'>,
  allFields: Array<Pick<ReferentielFormField, 'key'>>,
): boolean {
  const key = field.key ?? '';
  if (effectifFieldGender(key) == null || isEffectifTotalKey(key)) {
    return false;
  }
  if (isEffectifGenderPartitionPart(field, allFields)) {
    return false;
  }
  return /Handicap|Ivoirien|NonIvoiri|MoinsDe6/i.test(key);
}

function isAgeOnlyGenderKey(key: string, allKeys: string[]): boolean {
  if (effectifFieldGender(key) == null || isEffectifTotalKey(key)) {
    return false;
  }
  if (/Handicap|Ivoirien|NonIvoiri|Candidat|Admis/i.test(key)) {
    return false;
  }
  if (/MoinsDe6/i.test(key) && allKeys.some((k) => /Moins3|Cec35/i.test(k) && !/Ivoirien|Handicap|NonIvoiri/i.test(k))) {
    return false;
  }
  return true;
}

/** Plafond d’un sous-ensemble (même tranche + genre, sinon total du genre). */
export function effectifSubsetCap(
  key: string,
  values: Record<string, unknown>,
  allFields: Array<Pick<ReferentielFormField, 'key'>>,
): number {
  const gender = effectifFieldGender(key);
  if (gender == null) {
    return 0;
  }
  const keys = allFields.map((f) => f.key ?? '');
  const bracket = stripSubsetToken(key);
  let age = 0;
  let hasAge = false;
  let nationality = 0;
  let hasNationality = false;
  for (const other of keys) {
    if (effectifFieldGender(other) !== gender || isEffectifTotalKey(other)) {
      continue;
    }
    if (stripSubsetToken(other) !== bracket) {
      continue;
    }
    if (isAgeOnlyGenderKey(other, keys)) {
      age += numberOrZero(values[other]);
      hasAge = true;
    }
    if (/Ivoirien|NonIvoiri/i.test(other) && !/Handicap/i.test(other)) {
      nationality += numberOrZero(values[other]);
      hasNationality = true;
    }
  }
  if (hasAge) {
    return age;
  }
  if (/Handicap/i.test(key) && hasNationality) {
    return nationality;
  }
  return allFields
    .filter((f) => isEffectifGenderPartitionPart(f, allFields) && effectifFieldGender(f.key) === gender)
    .reduce((sum, f) => sum + numberOrZero(values[f.key]), 0);
}

export function effectifSubsetViolations(
  values: Record<string, unknown>,
  allFields: Array<Pick<ReferentielFormField, 'key' | 'label'>>,
): string[] {
  const messages: string[] = [];
  for (const field of allFields) {
    if (!isEffectifSubsetField(field, allFields)) {
      continue;
    }
    const n = numberOrZero(values[field.key]);
    if (n < 0) {
      messages.push(`${field.label || field.key} ne peut pas être négatif.`);
      continue;
    }
    const cap = effectifSubsetCap(field.key, values, allFields);
    if (n > cap) {
      messages.push(
        `${field.label || field.key} (${n}) dépasse le plafond (${cap}). Ivoiriens / handicap sont des sous-ensembles des totaux H/F.`,
      );
    }
  }
  return messages;
}

function stripSubsetToken(key: string): string {
  return key.replace(/NonIvoiri+en/gi, '').replace(/Ivoirien/gi, '').replace(/Handicap/gi, '');
}

function numberOrZero(value: unknown): number {
  if (value == null || value === '') {
    return 0;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}
