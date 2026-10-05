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

export function isNonIvoirienKey(key: string): boolean {
  return /NonIvoiri+en/i.test(key) && !/Handicap/i.test(key);
}

export function isIvoirienKey(key: string): boolean {
  return /Ivoirien/i.test(key) && !isNonIvoirienKey(key) && !/Handicap/i.test(key);
}

export function isHandicapKey(key: string): boolean {
  return /Handicap/i.test(key);
}

export function isNationalityPairForm(allFields: Array<Pick<ReferentielFormField, 'key'>>): boolean {
  const keys = allFields.map((f) => f.key ?? '');
  return keys.some(isIvoirienKey) && keys.some(isNonIvoirienKey);
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
  if (isNationalityPairForm(allFields) && (isIvoirienKey(key) || isNonIvoirienKey(key))) {
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
  return effectifCoherenceViolations(values, allFields);
}

/** Messages de contrôle (nationalité = classe, handicap = sous-ensemble). */
export function effectifCoherenceViolations(
  values: Record<string, unknown>,
  allFields: Array<Pick<ReferentielFormField, 'key' | 'label'>>,
): string[] {
  const messages: string[] = [];
  messages.push(...nationalityPairViolations(values, allFields, 'H'));
  messages.push(...nationalityPairViolations(values, allFields, 'F'));
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
        `${field.label || field.key} (${n}) dépasse le plafond (${cap}). Handicap (et ivoirien sans champ non-ivoirien) est un sous-ensemble.`,
      );
    }
  }
  return messages;
}

function nationalityPairViolations(
  values: Record<string, unknown>,
  allFields: Array<Pick<ReferentielFormField, 'key' | 'label'>>,
  gender: 'H' | 'F',
): string[] {
  const keys = allFields.map((f) => f.key ?? '');
  const ivoirien = keys.filter((k) => effectifFieldGender(k) === gender && isIvoirienKey(k));
  const nonIvoirien = keys.filter((k) => effectifFieldGender(k) === gender && isNonIvoirienKey(k));
  if (!ivoirien.length || !nonIvoirien.length) {
    return [];
  }
  const messages: string[] = [];
  const total = allFields
    .filter((f) => isEffectifTotalKey(f.key) && effectifFieldGender(f.key) === gender)
    .reduce((sum, f) => sum + numberOrZero(values[f.key]), 0);
  const sumI = ivoirien.reduce((sum, k) => sum + numberOrZero(values[k]), 0);
  const sumN = nonIvoirien.reduce((sum, k) => sum + numberOrZero(values[k]), 0);
  if (total > 0 && sumI === 0 && sumN === 0) {
    messages.push(
      `Ivoirien ${gender} et non-ivoirien ${gender} ne peuvent pas être tous les deux à 0 lorsque l’effectif total ${gender} n’est pas 0.`,
    );
  } else if (sumI + sumN !== total) {
    messages.push(
      `Ivoirien ${gender} + non-ivoirien ${gender} (${sumI + sumN}) doit être égal à l’effectif total ${gender} (${total}).`,
    );
  }
  const brackets = new Set([...ivoirien, ...nonIvoirien].map(stripSubsetToken));
  for (const bracket of brackets) {
    const iKey = ivoirien.find((k) => stripSubsetToken(k) === bracket);
    const nKey = nonIvoirien.find((k) => stripSubsetToken(k) === bracket);
    const ageKey = keys.find(
      (k) => effectifFieldGender(k) === gender && isAgeOnlyGenderKey(k, keys) && stripSubsetToken(k) === bracket,
    );
    if (!ageKey || !iKey || !nKey) {
      continue;
    }
    const age = numberOrZero(values[ageKey]);
    const i = numberOrZero(values[iKey]);
    const n = numberOrZero(values[nKey]);
    const ageLabel = allFields.find((f) => f.key === ageKey)?.label || ageKey;
    if (age > 0 && i === 0 && n === 0) {
      messages.push(
        `Ivoirien et non-ivoirien ${gender} ne peuvent pas être tous les deux à 0 sur « ${ageLabel} » (${age}).`,
      );
    } else if (i + n !== age) {
      messages.push(`Ivoirien + non-ivoirien ${gender} (${i + n}) doit être égal à « ${ageLabel} » (${age}).`);
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
