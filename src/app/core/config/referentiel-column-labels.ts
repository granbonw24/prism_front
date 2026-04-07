import { tryEffectifColumnLabel } from '@core/config/effectif-column-labels';

/**
 * Libellés d’en-têtes de colonnes pour les listes génériques (JSON plat API).
 * Les clés absentes passent par {@link humanizeApiPropertyKey}.
 */
export const REFERENTIEL_COLUMN_LABELS: Record<string, string> = {
  id: 'Réf.',
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
  idMilieuImplentation: 'Milieu d’implantation',
  idCommune: 'Commune',
  codeLocalite: 'Code localité',
  nomLocalite: 'Nom localité',
  cecIdCentre: 'Centre CEC (liaison)',
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
  libellePeriodicite: 'Libellé périodicité',
  libelleRegimeAlpha: 'Libellé régime',
  libelleStatutPersonnel: 'Libellé statut',
  libelleSupportDidactique: 'Libellé support',
  libelleTypeAlpha: 'Libellé type alpha',
  libelleTypeDocument: 'Libellé type document',
  libellePromoteur: 'Libellé promoteur',
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
  codeMilieuImplentation: 'Code milieu',
  libelleTypeImplentation: 'Milieu d’implantation',
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
