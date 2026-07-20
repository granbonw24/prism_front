import type { ReferentielFormField } from '@core/config/referentiel-form.types';

/** Groupe de champs numériques compatibles (tranche d’âge, candidats/admis, etc.). */
export type EffectifFieldGroup = {
  id: string;
  title: string;
  fields: ReferentielFormField[];
};

/**
 * Motifs ordonnés (du plus spécifique au plus générique) pour rattacher
 * un champ numérique à une tranche / famille métier.
 */
const BAND_PATTERNS: Array<{ id: string; title: string; test: (key: string, label: string) => boolean }> = [
  {
    id: 'cepe-candidats',
    title: 'Candidats CEPE',
    test: (k, l) => /candidat/i.test(k) || /candidat/i.test(l),
  },
  {
    id: 'cepe-admis',
    title: 'Admis CEPE',
    test: (k, l) =>
      (/admis/i.test(k) && !/candidat/i.test(k)) || (/admis/i.test(l) && !/candidat/i.test(l)),
  },
  {
    id: 'moins-de-6',
    title: 'Moins de 6 ans',
    test: (k, l) => /MoinsDe6|moinsDe6/i.test(k) || /moins\s*de\s*6/i.test(l),
  },
  {
    id: 'moins-3',
    title: 'Moins de 3 ans',
    test: (k, l) => /Moins3(?!\d)/i.test(k) || /moins\s*3(?!\s*\d)/i.test(l),
  },
  {
    id: 'moins-15',
    title: 'Moins de 15 ans',
    test: (k, l) => /Moins15/i.test(k) || /moins\s*15/i.test(l),
  },
  {
    id: '3-5',
    title: '3 – 5 ans',
    test: (k, l) => /(?:Cec|PromuCec|AbandonCec|HandicapCec)35/i.test(k) || /\b3\s*[-–]\s*5\b/i.test(l),
  },
  {
    id: '6-8',
    title: '6 – 8 ans',
    test: (k, l) => /(?:Cec|PromuCec|AbandonCec|HandicapCec)68/i.test(k) || /\b6\s*[-–]\s*8\b/i.test(l),
  },
  {
    id: '9-11',
    title: '9 – 11 ans',
    test: (k, l) => /911/i.test(k) || /\b9\s*[-–]\s*11\b/i.test(l),
  },
  {
    id: '12-13',
    title: '12 – 13 ans',
    test: (k, l) => /1213/i.test(k) || /\b12\s*[-–]\s*13\b/i.test(l),
  },
  {
    id: '12-16',
    title: '12 – 16 ans',
    test: (k, l) => /1216/i.test(k) || /\b12\s*[-–]\s*16\b/i.test(l),
  },
  {
    id: '14',
    title: '14 ans',
    test: (k, l) => /(?:Cp|AbandonCp|HandicapCp|AdmisIntegrationCp|IntegrationFormelCp)14/i.test(k) || /\b14\s+(ans|ivoir|handicap|non)/i.test(l) || /\b14\b$/i.test(l.trim()),
  },
  {
    id: '15-24',
    title: '15 – 24 ans',
    test: (k, l) => /1524/i.test(k) || /\b15\s*[-–]\s*24\b/i.test(l),
  },
  {
    id: '25-49',
    title: '25 – 49 ans',
    test: (k, l) => /2549/i.test(k) || /\b25\s*[-–]\s*49\b/i.test(l),
  },
  {
    id: '50-plus',
    title: '50 ans et plus',
    test: (k, l) => /50Plus|50_PLUS/i.test(k) || /\b50\s*\+/i.test(l),
  },
  {
    id: 'sie-3',
    title: '3 ans',
    test: (k, l) =>
      /(?:Sie|AbandonSie|PromuSie|ReverseFormelSie|HandicapSie)3(?!\d)/i.test(k) ||
      (/^3\b/.test(l.trim()) && !/3\s*[-–]/.test(l)),
  },
  {
    id: '4-6',
    title: '4 – 6 ans',
    test: (k, l) => /(?:Sie|AbandonSie|PromuSie|ReverseFormelSie|HandicapSie)46/i.test(k) || /\b4\s*[-–]\s*6\b/i.test(l),
  },
  {
    id: '7-9',
    title: '7 – 9 ans',
    test: (k, l) => /(?:Sie|AbandonSie|PromuSie|ReverseFormelSie|HandicapSie)79/i.test(k) || /\b7\s*[-–]\s*9\b/i.test(l),
  },
  {
    id: '10-12',
    title: '10 – 12 ans',
    test: (k, l) => /1012/i.test(k) || /\b10\s*[-–]\s*12\b/i.test(l),
  },
  {
    id: '13-14-plus',
    title: '13 – 14 ans et plus',
    test: (k, l) => /1314/i.test(k) || /\b13\s*[-–]\s*14/i.test(l),
  },
];

function resolveBand(field: ReferentielFormField): { id: string; title: string } {
  const key = field.key ?? '';
  const label = field.label ?? '';
  for (const band of BAND_PATTERNS) {
    if (band.test(key, label)) {
      return { id: band.id, title: band.title };
    }
  }
  return { id: 'autres', title: 'Autres effectifs' };
}

/**
 * Regroupe les rubriques numériques (hors totaux) par tranche d’âge / famille métier,
 * en conservant l’ordre d’apparition des champs.
 */
export function groupEffectifNumericParts(fields: ReferentielFormField[]): EffectifFieldGroup[] {
  const groups: EffectifFieldGroup[] = [];
  const indexById = new Map<string, number>();

  for (const field of fields) {
    const band = resolveBand(field);
    let idx = indexById.get(band.id);
    if (idx === undefined) {
      idx = groups.length;
      indexById.set(band.id, idx);
      groups.push({ id: band.id, title: band.title, fields: [] });
    }
    groups[idx].fields.push(field);
  }

  return groups;
}
