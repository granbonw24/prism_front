/**
 * Libellés lisibles pour colonnes d’effectif (abandon alpha, etc.).
 */
const ABANDON_AGE: Record<string, string> = {
  Moins15: 'Moins de 15 ans',
  '1524': '15-24 ans',
  '2549': '25-49 ans',
  '50Plus': '50 ans et +',
  NiveauHomme: 'Niveau — hommes',
  NiveauFemme: 'Niveau — femmes',
};

function abandonAlphaTailLabel(tail: string): string {
  if (tail === 'H') return 'Hommes';
  if (tail === 'F') return 'Femmes';
  if (tail === 'IvoirienH') return 'Ivoiriens (H)';
  if (tail === 'IvoirienF') return 'Ivoiriennes (F)';
  if (tail === 'HandicapH') return 'Handicap (H)';
  if (tail === 'HandicapF') return 'Handicap (F)';
  return '';
}

function tryEffectifAbandonAlphaLabel(key: string): string | null {
  const prefix = 'effectifAbandonAlpha';
  if (!key.startsWith(prefix)) {
    return null;
  }
  const rest = key.slice(prefix.length);
  if (!rest) {
    return null;
  }
  for (const [code, ageFr] of Object.entries(ABANDON_AGE)) {
    if (rest.startsWith(code)) {
      const tail = rest.slice(code.length);
      const tailFr = abandonAlphaTailLabel(tail);
      return tailFr ? `Abandon · ${ageFr} · ${tailFr}` : `Abandon · ${ageFr}`;
    }
  }
  return null;
}

/** Colonnes métier effectif (préfixes connus). */
export function tryEffectifColumnLabel(key: string): string | null {
  const abandon = tryEffectifAbandonAlphaLabel(key);
  if (abandon) {
    return abandon;
  }
  if (key === 'codeEffectifAbandonAlpha') {
    return 'Code fiche abandon';
  }
  if (key === 'codeEffectifAbandonCp' || key === 'codeEffectifAbandonCec') {
    return 'Code fiche abandon';
  }
  if (key === 'codeEffectifAbondanSie') {
    return 'Code fiche abandon (SIE)';
  }
  return null;
}
