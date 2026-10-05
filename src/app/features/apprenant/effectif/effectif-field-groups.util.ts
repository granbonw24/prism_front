import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { effectifFieldGender } from './effectif-field-gender.util';

/** Groupe de champs numériques (genre, puis nature : âge / ivoiriens / handicap). */
export type EffectifFieldGroup = {
  id: string;
  title: string;
  fields: ReferentielFormField[];
  children?: EffectifFieldGroup[];
};

const NATURE_ORDER: Array<{ id: string; title: string; test: (key: string, label: string) => boolean }> = [
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
    id: 'age',
    title: 'Tranches d’âge',
    test: (k, l) =>
      !/Handicap/i.test(k) &&
      !/handicap/i.test(l) &&
      !/NonIvoiri/i.test(k) &&
      !/non\s*ivoir/i.test(l) &&
      !/Ivoirien/i.test(k) &&
      !/ivoir/i.test(l),
  },
  {
    id: 'ivoirien',
    title: 'Ivoiriens',
    test: (k, l) =>
      !/Handicap/i.test(k) &&
      !/NonIvoiri/i.test(k) &&
      !/non\s*ivoir/i.test(l) &&
      (/Ivoirien/i.test(k) || /ivoir/i.test(l)),
  },
  {
    id: 'non-ivoirien',
    title: 'Non-ivoiriens',
    test: (k, l) => /NonIvoiri/i.test(k) || /non\s*ivoir/i.test(l),
  },
  {
    id: 'handicap',
    title: 'Situation de handicap',
    test: (k, l) => /Handicap/i.test(k) || /handicap/i.test(l),
  },
];

function resolveNature(field: ReferentielFormField): { id: string; title: string } {
  const key = field.key ?? '';
  const label = field.label ?? '';
  for (const nature of NATURE_ORDER) {
    if (nature.test(key, label)) {
      return { id: nature.id, title: nature.title };
    }
  }
  return { id: 'autres', title: 'Autres effectifs' };
}

function groupByNature(fields: ReferentielFormField[], idPrefix: string): EffectifFieldGroup[] {
  const buckets = new Map<string, EffectifFieldGroup>();
  const seen: string[] = [];

  for (const field of fields) {
    const nature = resolveNature(field);
    let group = buckets.get(nature.id);
    if (!group) {
      group = { id: `${idPrefix}-${nature.id}`, title: nature.title, fields: [] };
      buckets.set(nature.id, group);
      seen.push(nature.id);
    }
    group.fields.push(field);
  }

  const preferred = NATURE_ORDER.map((n) => n.id).filter((id) => buckets.has(id));
  const rest = seen.filter((id) => !preferred.includes(id));
  return [...preferred, ...rest].map((id) => buckets.get(id)!);
}

/**
 * Hommes (H) ensemble, puis femmes (F) ensemble.
 * Dans chaque genre : tranches d’âge, ivoiriens, non-ivoiriens, handicap.
 */
export function groupEffectifNumericParts(fields: ReferentielFormField[]): EffectifFieldGroup[] {
  const hommes: ReferentielFormField[] = [];
  const femmes: ReferentielFormField[] = [];
  const autres: ReferentielFormField[] = [];

  for (const field of fields) {
    const gender = effectifFieldGender(field.key);
    if (gender === 'H') {
      hommes.push(field);
    } else if (gender === 'F') {
      femmes.push(field);
    } else {
      autres.push(field);
    }
  }

  const groups: EffectifFieldGroup[] = [];
  if (hommes.length) {
    groups.push({
      id: 'hommes',
      title: 'Hommes (H)',
      fields: [],
      children: groupByNature(hommes, 'h'),
    });
  }
  if (femmes.length) {
    groups.push({
      id: 'femmes',
      title: 'Femmes (F)',
      fields: [],
      children: groupByNature(femmes, 'f'),
    });
  }
  if (autres.length) {
    groups.push(...groupByNature(autres, 'x'));
  }
  return groups;
}
