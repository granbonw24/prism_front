import type { ReferentielFormField } from '@core/config/referentiel-form.types';

import {
  FK_ANNEE_SCOLAIRE,
  FK_CENTRE_CP,
  FK_NIVEAU_CP,
  FK_PERIODE_ACTIVITE,
} from './effectif-satellite-forms.data';

function num(key: string, label: string, effectifRole?: 'total' | 'part'): ReferentielFormField {
  return effectifRole ? { key, label, type: 'number', effectifRole } : { key, label, type: 'number' };
}

function numTotalH(key: string): ReferentielFormField {
  return num(key, 'Effectif total (H)', 'total');
}

function numTotalF(key: string): ReferentielFormField {
  return num(key, 'Effectif total (F)', 'total');
}

function numLegacyTotal(key: string): ReferentielFormField {
  return { key, label: 'Effectif total', type: 'number', hidden: true, effectifRole: 'legacyTotal' };
}

/** Centres CP non encore promus (liste standard exclut estPromu=true). */
const FK_CENTRE_CP_NON_PROMU: ReferentielFormField = {
  ...FK_CENTRE_CP,
  label: 'Classe passerelle (centre à promouvoir)',
  optionsApiPath: '/api/cp?estPromu=false',
};

/** Centres promus CP — `/api/effectif-promu-cp` */
export const EFFECTIF_PROMU_CP_CREATE_FIELDS: ReferentielFormField[] = [
  FK_PERIODE_ACTIVITE,
  FK_ANNEE_SCOLAIRE,
  FK_NIVEAU_CP,
  FK_CENTRE_CP_NON_PROMU,
  numTotalH('effectifPromuCpNiveauH'),
  numTotalF('effectifPromuCpNiveauF'),
  numLegacyTotal('effectifPromuCpNiveauCp'),
  num('effectifPromuCp911IvoirienH', 'Promu CP — 9-11 Ivoirien Garçon', 'part'),
  num('effectifPromuCp911IvoirienF', 'Promu CP — 9-11 Ivoirienne Fille', 'part'),
  num('effectifPromuCp911HandicapH', 'Promu CP — 9-11 Handicap Garçon', 'part'),
  num('effectifPromuCp911HandicapF', 'Promu CP — 9-11 Handicap Fille', 'part'),
  num('effectifPromuCp911NonIvoirienF', 'Promu CP — 9-11 Non Ivoirienne Fille', 'part'),
  num('effectifPromuCp911NonIvoirienH', 'Promu CP — 9-11 Non Ivoirien Garçon', 'part'),
  num('effectifPromuCp1213IvoirienF', 'Promu CP — 12-13 Ivoirienne Fille', 'part'),
  num('effectifPromuCp1213IvoirienH', 'Promu CP — 12-13 Ivoirien Garçon', 'part'),
  num('effectifPromuCp1213HandicapH', 'Promu CP — 12-13 Handicap Garçon', 'part'),
  num('effectifPromuCp1213HandicapF', 'Promu CP — 12-13 Handicap Fille', 'part'),
  num('effectifPromuCp1213NonIvoiriienH', 'Promu CP — 12-13 Non Ivoirien Garçon', 'part'),
  num('effectifPromuCp1213NonIvoiriienF', 'Promu CP — 12-13 Non Ivoirienne Fille', 'part'),
  num('effectifPromuCp14IvoirienH', 'Promu CP — 14 Ivoirien Garçon', 'part'),
  num('effectifPromuCp14IvoirienF', 'Promu CP — 14 Ivoirienne Fille', 'part'),
  num('effectifPromuCp14HandicapH', 'Promu CP — 14 Handicap Garçon', 'part'),
  num('effectifPromuCp14HandicapF', 'Promu CP — 14 Handicap Fille', 'part'),
  num('effectifPromuCp14NonIvoirienF', 'Promu CP — 14 Non Ivoirienne Fille', 'part'),
  num('effectifPromuCp14NonIvoirienH', 'Promu CP — 14 Non Ivoirien Garçon', 'part'),
];
