/**
 * Contexte pour enrichir les listes effectif / référentiel :
 * jointure centres, périodes, années, niveaux → filtres + graphiques.
 */
export interface ListStatsContext {
  /** Libellé court affiché dans les titres (ex. « Alpha », « CP »). */
  scopeLabel: string;
  centresApiPath?: string;
  rowCentreIdKey?: string;
  centreOptionValueKey?: string;
  centreOptionLabelKeys?: string[];
  /** Ex. 2ᵉ centre CEC (CEPE). */
  secondaryCentresApiPath?: string;
  secondaryRowCentreIdKey?: string;
  rowPeriodeIdKey?: string;
  periodesApiPath?: string;
  periodeOptionValueKey?: string;
  periodeOptionLabelKeys?: string[];
  rowAnneeIdKey?: string;
  anneesApiPath?: string;
  anneeOptionValueKey?: string;
  anneeOptionLabelKeys?: string[];
  rowNiveauIdKey?: string;
  niveauxApiPath?: string;
  niveauOptionValueKey?: string;
  niveauOptionLabelKeys?: string[];
}

export interface ContextChartPanel {
  title: string;
  kind: 'bar' | 'doughnut';
  labels: string[];
  data: number[];
}
