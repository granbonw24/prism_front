import { tryEffectifColumnLabel } from '@core/config/effectif-column-labels';

/**
 * Libellés d’en-têtes de colonnes pour les listes génériques (JSON plat API).
 * Les clés absentes passent par {@link humanizeApiPropertyKey}.
 */
export const REFERENTIEL_COLUMN_LABELS: Record<string, string> = {
  code: 'Code',
  libelle: 'Libellé',
  existe: 'Existe',
  ajour: 'À jour',
  bientenu: 'Bien tenu',
  respmethode: 'Resp. méthode',
  bienrensigne: 'Bien renseigné',
  debutAnneeScolaire: 'Début année scolaire',
  finAnneeScolaire: 'Fin année scolaire',
  etatAnneeScolaire: 'Année en cours',
  dateDebutCampagne: 'Début campagne',
  dateFinCampagne: 'Fin campagne',
  etatCampagne: 'Campagne active',
  idAnneeScolaire: 'Année scolaire',
  idCentre: 'Centre',
  idPeriodeActivite: 'Période d’activité',
  idNiveauAlpha: 'Niveau alpha',
  idNiveauCp: 'Niveau CP',
  idNiveauSie: 'Niveau SIE / CEC',
  idPromoteur: 'Personne morale',
  idNatureDocument: 'Nature du document',
  idTypeDocument: 'Type de document',
  idMaterielPedagogique: 'Matériel pédagogique',
  idSousPrefecture: 'Sous-préfecture',
  idMilieuImplentation: 'Zone d’implantation',
  idCommune: 'Commune',
  idRegion: 'Région',
  idDrena: 'DRENA',
  idDepartement: 'Département',
  codeLocalite: 'Code localité',
  nomLocalite: 'Nom localité',
  cecIdCentre: 'École de rattachement',
  libelleAutoriteAutorisation: 'Libellé autorité',
  libelleCategorieAppui: 'Libellé catégorie',
  libelleCivilite: 'Libellé civilité',
  libelleCommunaute: 'Libellé communauté',
  libelleCompetence: 'Libellé compétence',
  libelleDesignation: 'Libellé désignation',
  libelleDifficulte: 'Libellé difficulté',
  libelleDiplome: 'Libellé diplôme',
  libelleDomaineActivite: 'Libellé domaine',
  libelleFonction: 'Libellé fonction',
  libelleImpact: 'Libellé impact',
  libelleInfrastructure: 'Libellé infrastructure',
  libelleLangue: 'Langue',
  libelleMaterielPedagogique: 'Libellé matériel',
  libelleMinistere: 'Libellé ministère',
  libelleModealpha: 'Libellé mode alpha',
  libelleNatureCentre: 'Libellé nature centre',
  libelleNatureDocument: 'Libellé nature document',
  libelleNiveauAlpha: 'Libellé niveau alpha',
  libelleNiveauCp: 'Libellé niveau CP',
  libelleNiveauSie: 'Libellé niveau SIE',
  libellePartenaire: 'Libellé partenaire',
  libellePeriodeActivite: 'Libellé période',
  libellePeriodicite: 'Périodicité',
  libelleRegimeAlpha: 'Libellé régime',
  libelleStatutPersonnel: 'Libellé statut',
  libelleSupportDidactique: 'Libellé support',
  libelleTypeAlpha: 'Libellé type alpha',
  libelleTypeSie: 'Libellé type SIE',
  libelleTypeDocument: 'Libellé type document',
  libelleEcoleTutrice: 'École tutrice',
  codeEcoleTutrice: 'Code école tutrice',
  libellePromoteur: 'Promoteur',
  denomination: 'Dénomination',
  nomProgramme: 'Nom du programme',
  nomRepresentantLegalStructure: 'Représentant légal',
  contact: 'Contact',
  boitePostale: 'Boîte postale',
  mail: 'Courriel',
  codePromoteur: 'Code promoteur',
  libelleAutreMateriel: 'Autre matériel',
  causeAbandonAlpha: 'Cause abandon',
  codePeriodeActivite: 'Code période',
  codeCentre: 'Code centre',
  codeType: 'Type (code)',
  nomSousPrefecture: 'Nom sous-préfecture',
  codeSousPrefecture: 'Code sous-préfecture',
  nomCommune: 'Nom commune',
  codeCommune: 'Code commune',
  codeRegion: 'Code région',
  libelleRegion: 'Région',
  codeDrena: 'Code DRENA',
  nomDrena: 'Nom DRENA',
  mailDrena: 'Mail DRENA',
  telephoneDrena: 'Téléphone DRENA',
  codeDepartement: 'Code département',
  nomDepartement: 'Nom département',
  codeIep: 'Code IEPP',
  nomIep: 'Nom IEPP',
  mailIep: 'Mail IEPP',
  telephoneIep: 'Téléphone IEPP',
  codeMilieuImplentation: 'Code milieu',
  libelleTypeImplentation: 'Zone d’implantation',
  /** Références enrichies (effectif, format B API) */
  periodeActivite: 'Période d’activité',
  alpha: "Centre d'Alphabétisation",
  niveauAlpha: 'Niveau Alpha',
  centre: 'Centre',
  region: 'Région',
  drena: 'DRENA',
  departement: 'Département',
  sousPrefecture: 'Sous-préfecture',
  milieuImplantation: 'Zone d’implantation',
  commune: 'Commune',
  anneeScolaire: 'Année scolaire',
  niveauCp: 'Niveau CP',
  niveauSie: 'Niveau SIE / CEC',
  codeEffectifAlpha: 'Code fiche',
  codeEffectifCec: 'Code fiche',
  codeEffectifCp: 'Code fiche',
  codeEffectifSie: 'Code fiche',
  effectifAlphaNiveauH: 'Effectif total (H)',
  effectifAlphaNiveauF: 'Effectif total (F)',
  effectifCecNiveauH: 'Effectif total (H)',
  effectifCecNiveauF: 'Effectif total (F)',
  effectifCecNiveauCec: 'Effectif niveau CEC',
  effectifCpNiveauH: 'Effectif total (H)',
  effectifCpNiveauF: 'Effectif total (F)',
  effectifCpNiveauCp: 'Effectif niveau CP',
  effectifSieNiveauH: 'Effectif total (H)',
  effectifSieNiveauF: 'Effectif total (F)',
  effectifSieNiveauSie: 'Effectif niveau SIE',
  /** Abandons — colonnes résumé liste */
  effectifAbandonAlphaNiveauHomme: 'Effectif total (H)',
  effectifAbandonAlphaNiveauFemme: 'Effectif total (F)',
  effectifAbandonCpNiveauH: 'Effectif total (H)',
  effectifAbandonCpNiveauF: 'Effectif total (F)',
  effectifAbandonCpNiveauCp: 'Abandon — effectif total',
  effectifAbandonCecNiveauH: 'Effectif total (H)',
  effectifAbandonCecNiveauF: 'Effectif total (F)',
  effectifAbandonCecNiveauCec: 'Abandon — eff. niveau CEC',
  effectifAbandonSieNiveauH: 'Effectif total (H)',
  effectifAbandonSieNiveauF: 'Effectif total (F)',
  effectifAbandonSieNiveauSie: 'Abandon — eff. niveau SIE',
  effectifCepeCpNiveauH: 'Effectif total (H)',
  effectifCepeCpNiveauF: 'Effectif total (F)',
  effectifCepeCecNiveauH: 'Effectif total (H)',
  effectifCepeCecNiveauF: 'Effectif total (F)',
  effectifAdmisIntegrationCpNiveauH: 'Effectif total (H)',
  effectifAdmisIntegrationCpNiveauF: 'Effectif total (F)',
  effectifIntegrationFormelCpNiveauH: 'Effectif total (H)',
  effectifIntegrationFormelCpNiveauF: 'Effectif total (F)',
  effectifPromuSieNiveauH: 'Effectif total (H)',
  effectifPromuSieNiveauF: 'Effectif total (F)',
  effectifPromuCecNiveauH: 'Effectif total (H)',
  effectifPromuCecNiveauF: 'Effectif total (F)',
  effectifReverseFormelSieNiveauH: 'Effectif total (H)',
  effectifReverseFormelSieNiveauF: 'Effectif total (F)',
  effectifSituationHandicapCpNiveauH: 'Effectif total (H)',
  effectifSituationHandicapCpNiveauF: 'Effectif total (F)',
  effectifSituationHandicapCecNiveauH: 'Effectif total (H)',
  effectifSituationHandicapCecNiveauF: 'Effectif total (F)',
  effectifSituationHandicapSieNiveauH: 'Effectif total (H)',
  effectifSituationHandicapSieNiveauF: 'Effectif total (F)',
  causeAbandonCp: 'Cause abandon',
  causeAbandonCec: 'Cause abandon',
  causeAbandonSie: 'Cause abandon',
  codeAbandonEffectifSie: 'Code fiche',
};

/**
 * Fallback : découpe camelCase et met une majuscule initiale (fr).
 */
export function humanizeApiPropertyKey(key: string): string {
  const mapped = REFERENTIEL_COLUMN_LABELS[key];
  if (mapped) {
    return mapped;
  }
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/_/g, ' ');
  const trimmed = spaced.trim();
  if (!trimmed) {
    return key;
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function resolveColumnHeaderLabel(
  key: string,
  routeOverrides?: Record<string, string> | null,
): string {
  const o = routeOverrides?.[key];
  if (o) {
    return o;
  }
  const effectif = tryEffectifColumnLabel(key);
  if (effectif) {
    return effectif;
  }
  return humanizeApiPropertyKey(key);
}
