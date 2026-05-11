import type { ListStatsContext } from '@core/config/list-stats-context.types';

const CENTRE_KEYS = {
  optionValueKey: 'idCentre',
  optionLabelKeys: ['codeType', 'libelle', 'codeCentre'],
} as const;

export function effectifStatsByCentreType(
  t: 'alpha' | 'cp' | 'cec' | 'sie',
): ListStatsContext {
  const scopeLabel = { alpha: 'Alpha', cp: 'CP', cec: 'CEC', sie: 'SIE' }[t];

  /** Effectif SIE : pas de rattachement centre dans le JSON liste. */
  if (t === 'sie') {
    return {
      scopeLabel,
      rowAnneeIdKey: 'anneeScolaire',
      anneesApiPath: '/api/anneescolaire',
      anneeOptionValueKey: 'id',
      anneeOptionLabelKeys: ['debutAnneeScolaire', 'finAnneeScolaire'],
      rowNiveauIdKey: 'niveauSie',
      niveauxApiPath: '/api/niveausiecec',
      niveauOptionValueKey: 'id',
      niveauOptionLabelKeys: ['libelleNiveauSie'],
    };
  }

  const centresApiPath = {
    alpha: '/api/alpha',
    cp: '/api/cp',
    cec: '/api/cec',
  }[t];

  const base: ListStatsContext = {
    scopeLabel,
    centresApiPath,
    /** Réponses enrichies (`ReferentielEnricher`) : ref sous `alpha` ou `centre`, pas `idCentre` scalaire. */
    rowCentreIdKey: t === 'alpha' ? 'alpha' : 'centre',
    centreOptionValueKey: CENTRE_KEYS.optionValueKey,
    centreOptionLabelKeys: [...CENTRE_KEYS.optionLabelKeys],
  };

  if (t === 'alpha') {
    return {
      ...base,
      rowPeriodeIdKey: 'periodeActivite',
      periodesApiPath: '/api/PeriodeActivites',
      periodeOptionValueKey: 'id',
      periodeOptionLabelKeys: ['codePeriodeActivite', 'libellePeriodeActivite'],
      rowNiveauIdKey: 'niveauAlpha',
      niveauxApiPath: '/api/niveaualpha',
      niveauOptionValueKey: 'id',
      niveauOptionLabelKeys: ['codeNiveauAlpha', 'libelleNiveauAlpha'],
    };
  }

  if (t === 'cec') {
    return {
      ...base,
      rowPeriodeIdKey: 'periodeActivite',
      periodesApiPath: '/api/PeriodeActivites',
      periodeOptionValueKey: 'id',
      periodeOptionLabelKeys: ['codePeriodeActivite', 'libellePeriodeActivite'],
      rowNiveauIdKey: 'niveauSie',
      niveauxApiPath: '/api/niveausiecec',
      niveauOptionValueKey: 'id',
      niveauOptionLabelKeys: ['libelleNiveauSie'],
    };
  }

  // CP : année scolaire + niveau CP (pas de période d’activité)
  return {
    ...base,
    rowAnneeIdKey: 'anneeScolaire',
    anneesApiPath: '/api/anneescolaire',
    anneeOptionValueKey: 'id',
    anneeOptionLabelKeys: ['debutAnneeScolaire', 'finAnneeScolaire'],
    rowNiveauIdKey: 'niveauCp',
    niveauxApiPath: '/api/niveaucp',
    niveauOptionValueKey: 'id',
    niveauOptionLabelKeys: ['libelleNiveauCp'],
  };
}

/** Promu SIE, reverse formel SIE — pas de centre dans les lignes. */
export function effectifStatsAnneeNiveauSie(): ListStatsContext {
  return {
    scopeLabel: 'SIE',
    rowAnneeIdKey: 'idAnneeScolaire',
    anneesApiPath: '/api/anneescolaire',
    anneeOptionValueKey: 'id',
    anneeOptionLabelKeys: ['debutAnneeScolaire', 'finAnneeScolaire'],
    rowNiveauIdKey: 'idNiveauSie',
    niveauxApiPath: '/api/niveausiecec',
    niveauOptionValueKey: 'id',
    niveauOptionLabelKeys: ['libelleNiveauSie'],
  };
}

/** CEPE / admis / intégration formelle CP. */
export function effectifStatsCpWithAnneeNiveau(): ListStatsContext {
  return {
    scopeLabel: 'CP',
    centresApiPath: '/api/cp',
    rowCentreIdKey: 'idCentre',
    centreOptionValueKey: CENTRE_KEYS.optionValueKey,
    centreOptionLabelKeys: [...CENTRE_KEYS.optionLabelKeys],
    rowAnneeIdKey: 'idAnneeScolaire',
    anneesApiPath: '/api/anneescolaire',
    anneeOptionValueKey: 'id',
    anneeOptionLabelKeys: ['debutAnneeScolaire', 'finAnneeScolaire'],
    rowNiveauIdKey: 'idNiveauCp',
    niveauxApiPath: '/api/niveaucp',
    niveauOptionValueKey: 'id',
    niveauOptionLabelKeys: ['libelleNiveauCp'],
  };
}

/** CEPE CEC — deux rattachements centre. */
export function effectifStatsCepeCec(): ListStatsContext {
  return {
    scopeLabel: 'CEC (CEPE)',
    centresApiPath: '/api/cec',
    rowCentreIdKey: 'idCentre',
    centreOptionValueKey: CENTRE_KEYS.optionValueKey,
    centreOptionLabelKeys: [...CENTRE_KEYS.optionLabelKeys],
    secondaryCentresApiPath: '/api/cec',
    secondaryRowCentreIdKey: 'cecIdCentre',
    rowAnneeIdKey: 'idAnneeScolaire',
    anneesApiPath: '/api/anneescolaire',
    anneeOptionValueKey: 'id',
    anneeOptionLabelKeys: ['debutAnneeScolaire', 'finAnneeScolaire'],
  };
}

export function effectifStatsPromuCec(): ListStatsContext {
  return {
    scopeLabel: 'CEC',
    centresApiPath: '/api/cec',
    rowCentreIdKey: 'idCentre',
    centreOptionValueKey: CENTRE_KEYS.optionValueKey,
    centreOptionLabelKeys: [...CENTRE_KEYS.optionLabelKeys],
    rowAnneeIdKey: 'idAnneeScolaire',
    anneesApiPath: '/api/anneescolaire',
    anneeOptionValueKey: 'id',
    anneeOptionLabelKeys: ['debutAnneeScolaire', 'finAnneeScolaire'],
    rowNiveauIdKey: 'idNiveauSie',
    niveauxApiPath: '/api/niveausiecec',
    niveauOptionValueKey: 'id',
    niveauOptionLabelKeys: ['libelleNiveauSie'],
  };
}

export type IntegrationStatsKind =
  | 'cepeCp'
  | 'cepeCec'
  | 'admisCp'
  | 'formelCp'
  | 'promuSie'
  | 'promuCec'
  | 'reverseSie';

export function integrationListStatsContext(kind: IntegrationStatsKind): ListStatsContext {
  switch (kind) {
    case 'cepeCp':
    case 'admisCp':
    case 'formelCp':
      return effectifStatsCpWithAnneeNiveau();
    case 'cepeCec':
      return effectifStatsCepeCec();
    case 'promuCec':
      return effectifStatsPromuCec();
    case 'promuSie':
    case 'reverseSie':
      return effectifStatsAnneeNiveauSie();
    default:
      return effectifStatsCpWithAnneeNiveau();
  }
}
