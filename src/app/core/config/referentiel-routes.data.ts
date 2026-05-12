import type { ReferentielFormField } from '@core/config/referentiel-form.types';

/** Regroupement menu Paramétrage + dossier `features/parametrage/<id>/…`. */
export type ReferentielMenuGroupId =
  | 'geographie'
  | 'centres-autorisations'
  | 'pedagogie'
  | 'activites-centre'
  | 'documents'
  | 'others';

/**
 * Correspondance routes Angular ↔ chemins API Spring (`@RequestMapping`).
 * `createFields` : formulaire « Ajouter » (POST JSON). Vide = modal d’information seulement.
 * Les champs **code** métier sont générés côté API (`@AutoCode` + `CodeGeneratorService`) si non envoyés.
 */
export interface ReferentielRouteData {
  path: string;
  title: string;
  /** Regroupement explicite du menu Paramétrage (remplace l’heuristique historique). */
  menuGroup: ReferentielMenuGroupId;
  /** Chemin relatif depuis l’origine API (ex. `/api/anneescolaire`). */
  apiPath: string;
  createFields?: ReferentielFormField[];
  /** Surcharges de libellés de colonnes (clé JSON → libellé affiché). */
  columnLabels?: Record<string, string>;
}

const F = (
  key: string,
  label: string,
  type: ReferentielFormField['type'],
  opts?: {
    required?: boolean;
    maxLength?: number;
    optionsApiPath?: string;
    options?: Array<{ value: string | number; label: string }>;
    optionValueKey?: string;
    optionLabelKeys?: string[];
    payloadAsObjectId?: boolean;
  },
): ReferentielFormField => ({
  key,
  label,
  type,
  required: opts?.required ?? false,
  maxLength: opts?.maxLength,
  optionsApiPath: opts?.optionsApiPath,
  options: opts?.options,
  optionValueKey: opts?.optionValueKey,
  optionLabelKeys: opts?.optionLabelKeys,
  payloadAsObjectId: opts?.payloadAsObjectId,
});

export const REFERENTIEL_ROUTE_DATA: ReferentielRouteData[] = [
  {
    path: 'anneescolaire',
    title: 'Années scolaires',
    menuGroup: 'others',
    apiPath: '/api/anneescolaire',
    createFields: [
      F('debutAnneeScolaire', 'Date début', 'date', { required: true }),
      F('finAnneeScolaire', 'Date fin', 'date', { required: true }),
      F('etatAnneeScolaire', 'Année en cours', 'checkbox'),
    ],
  },
  {
    path: 'autoriteautorisation',
    title: 'Autorités d’autorisation',
    menuGroup: 'centres-autorisations',
    apiPath: '/api/autoriteautorisation',
    createFields: [
      F('libelleAutoriteAutorisation', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'campagne',
    title: 'Campagnes',
    menuGroup: 'centres-autorisations',
    apiPath: '/api/campagnes',
    createFields: [
      F('dateDebutCampagne', 'Date début', 'date', { required: true }),
      F('dateFinCampagne', 'Date fin', 'date', { required: true }),
      F('etatCampagne', 'Campagne active', 'checkbox'),
    ],
  },
  {
    path: 'categorieappui',
    title: 'Catégories d’appui',
    menuGroup: 'others',
    apiPath: '/api/categorieappuis',
    createFields: [
      F('libelleCategorieAppui', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'civilite',
    title: 'Civilités',
    menuGroup: 'others',
    apiPath: '/api/civilite',
    createFields: [
      F('libelleCivilite', 'Libellé', 'text', { required: true, maxLength: 10 }),
    ],
  },
  {
    path: 'communaute',
    title: 'Communautés',
    menuGroup: 'others',
    apiPath: '/api/communautes',
    createFields: [
      F('idPromoteur', 'Personne morale (promoteur)', 'select', {
        required: true,
        optionsApiPath: '/api/personnemorale',
        optionValueKey: 'id',
        optionLabelKeys: ['codePromoteur', 'libellePromoteur', 'denomination'],
      }),
      F('libelleCommunaute', 'Libellé communauté', 'text', { maxLength: 100 }),
      F('libellePromoteur', 'Libellé promoteur', 'text', { maxLength: 100 }),
      F('denomination', 'Dénomination', 'text', { maxLength: 100 }),
      F('nomProgramme', 'Nom programme', 'text', { maxLength: 100 }),
      F(
        'nomRepresentantLegalStructure',
        'Représentant légal',
        'text',
        { maxLength: 100 },
      ),
      F('contact', 'Contact', 'text', { maxLength: 10 }),
      F('boitePostale', 'Boîte postale', 'text', { maxLength: 100 }),
      F('mail', 'Mail', 'text', { maxLength: 100 }),
    ],
  },
  {
    path: 'competence',
    title: 'Compétences',
    menuGroup: 'others',
    apiPath: '/api/competence',
    createFields: [
      F('libelleCompetence', 'Libellé', 'text', { required: true, maxLength: 20 }),
    ],
  },
  {
    path: 'designation',
    title: 'Désignations',
    menuGroup: 'others',
    apiPath: '/api/designation',
    createFields: [
      F('libelleDesignation', 'Libellé', 'text', { required: true, maxLength: 50 }),
    ],
  },
  {
    path: 'difficulte',
    title: 'Difficultés',
    menuGroup: 'others',
    apiPath: '/api/difficulte',
    createFields: [
      F('libelleDifficulte', 'Libellé', 'text', { required: true, maxLength: 50 }),
    ],
  },
  {
    path: 'diplome',
    title: 'Diplômes',
    menuGroup: 'others',
    apiPath: '/api/diplome',
    createFields: [
      F('libelleDiplome', 'Libellé', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'document',
    title: 'Documents',
    menuGroup: 'documents',
    apiPath: '/api/documents',
    createFields: [
      F('idNatureDocument', 'Nature du document', 'select', {
        required: true,
        optionsApiPath: '/api/naturedocument',
        optionValueKey: 'id',
        optionLabelKeys: ['libelleNatureDocument'],
      }),
      F('idTypeDocument', 'Type de document', 'select', {
        required: true,
        optionsApiPath: '/api/TypeDocuments',
        optionValueKey: 'id',
        optionLabelKeys: ['codeTypeDocument', 'libelleTypeDocument'],
      }),
      F('idCentre', 'Centre alpha', 'select', {
        required: true,
        optionsApiPath: '/api/alpha',
        optionValueKey: 'idCentre',
        optionLabelKeys: ['codeType', 'libelle', 'codeCentre'],
      }),
      F('existe', 'Existe', 'text', { maxLength: 30 }),
      F('ajour', 'À jour', 'text', { maxLength: 30 }),
      F('bientenu', 'Bien tenu', 'text', { maxLength: 30 }),
      F('respmethode', 'Resp. méthode', 'text', { maxLength: 50 }),
      F('bienrensigne', 'Bien renseigné', 'text', { maxLength: 30 }),
    ],
  },
  {
    path: 'discipline',
    title: 'Disciplines',
    menuGroup: 'activites-centre',
    apiPath: '/api/disciplines',
    createFields: [
      F('libelleDiscipline', 'Libellé discipline', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'domaineactivite',
    title: 'Domaines d’activité',
    menuGroup: 'others',
    apiPath: '/api/domaine-activite',
    createFields: [
      F('libelleDomaineActivite', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'fonction',
    title: 'Fonctions',
    menuGroup: 'others',
    apiPath: '/api/fonctions',
    createFields: [
      F('libelleFonction', 'Libellé', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'region',
    title: 'Régions',
    menuGroup: 'geographie',
    apiPath: '/api/region',
    createFields: [
      F('codeRegion', 'Code région', 'text', { maxLength: 10 }),
      F('libelleRegion', 'Libellé région', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'drena',
    title: 'DRENA',
    menuGroup: 'geographie',
    apiPath: '/api/drena',
    createFields: [
      F('codeDrena', 'Code DRENA', 'text', { maxLength: 10 }),
      F('nomDrena', 'Nom DRENA', 'text', { required: true, maxLength: 30 }),
      F('mailDrena', 'Mail DRENA', 'text', { maxLength: 30 }),
      F('telephoneDrena', 'Téléphone DRENA', 'text', { maxLength: 15 }),
    ],
  },
  {
    path: 'departement',
    title: 'Départements',
    menuGroup: 'geographie',
    apiPath: '/api/departement',
    createFields: [
      F('idRegion', 'Région', 'select', {
        optionsApiPath: '/api/region',
        optionValueKey: 'id',
        optionLabelKeys: ['code', 'libelle', 'codeRegion', 'libelleRegion'],
        payloadAsObjectId: true,
      }),
      F('codeDepartement', 'Code département', 'text', { maxLength: 10 }),
      F('nomDepartement', 'Nom département', 'text', { required: true, maxLength: 30 }),
    ],
  },
  {
    path: 'drena-departement',
    title: 'Couverture DRENA / Départements',
    menuGroup: 'geographie',
    apiPath: '/api/drena-departement',
    createFields: [
      F('idDrena', 'DRENA', 'select', {
        required: true,
        optionsApiPath: '/api/drena',
        optionValueKey: 'id',
        optionLabelKeys: ['code', 'libelle', 'codeDrena', 'nomDrena'],
        payloadAsObjectId: true,
      }),
      F('idDepartement', 'Département', 'select', {
        required: true,
        optionsApiPath: '/api/departement',
        optionValueKey: 'id',
        optionLabelKeys: ['code', 'libelle', 'codeDepartement', 'nomDepartement'],
        payloadAsObjectId: true,
      }),
    ],
  },
  {
    path: 'iep',
    title: 'IEPP',
    menuGroup: 'geographie',
    apiPath: '/api/iep',
    createFields: [
      F('idDrena', 'DRENA', 'select', {
        required: true,
        optionsApiPath: '/api/drena',
        optionValueKey: 'id',
        optionLabelKeys: ['code', 'libelle', 'codeDrena', 'nomDrena'],
        payloadAsObjectId: true,
      }),
      F('codeIep', 'Code IEPP', 'text', { maxLength: 10 }),
      F('nomIep', 'Nom IEPP', 'text', { required: true, maxLength: 30 }),
      F('mailIep', 'Mail IEPP', 'text', { maxLength: 30 }),
      F('telephoneIep', 'Téléphone IEPP', 'text', { maxLength: 10 }),
    ],
  },
  {
    path: 'sous-prefecture',
    title: 'Sous-préfectures',
    menuGroup: 'geographie',
    apiPath: '/api/sous-prefecture',
    createFields: [
      F('idDepartement', 'Département', 'select', {
        required: true,
        optionsApiPath: '/api/departement',
        optionValueKey: 'id',
        optionLabelKeys: ['code', 'libelle', 'codeDepartement', 'nomDepartement'],
        payloadAsObjectId: true,
      }),
      F('codeSousPrefecture', 'Code sous-préfecture', 'text', { maxLength: 10 }),
      F('nomSousPrefecture', 'Nom sous-préfecture', 'text', { required: true, maxLength: 30 }),
    ],
  },
  {
    path: 'commune',
    title: 'Communes',
    menuGroup: 'geographie',
    apiPath: '/api/commune',
    createFields: [
      F('codeCommune', 'Code commune', 'text', { maxLength: 10 }),
      F('nomCommune', 'Nom commune', 'text', { required: true, maxLength: 30 }),
    ],
  },
  {
    path: 'impact',
    title: 'Impacts',
    menuGroup: 'others',
    apiPath: '/api/impact',
    createFields: [
      F('libelleImpact', 'Libellé', 'text', { required: true, maxLength: 50 }),
    ],
  },
  {
    path: 'infrastructure',
    title: 'Infrastructures',
    menuGroup: 'others',
    apiPath: '/api/infrastructure',
    createFields: [
      F('libelleInfrastructure', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'langueapprentissage',
    title: 'Langues d’apprentissage',
    menuGroup: 'pedagogie',
    apiPath: '/api/LangueApprentissages',
    createFields: [
      F('idCentre', 'Centre', 'select', {
        required: true,
        optionsApiPath: '/api/centres',
        optionValueKey: 'id',
        optionLabelKeys: ['codeCentre'],
      }),
      F('libelleLangue', 'Libellé langue', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'materielalpha',
    title: 'Matériel alpha',
    menuGroup: 'pedagogie',
    apiPath: '/api/materielalpha',
    createFields: [
      F('idCentre', 'Centre alpha', 'select', {
        required: true,
        optionsApiPath: '/api/alpha',
        optionValueKey: 'idCentre',
        optionLabelKeys: ['codeType', 'libelle', 'codeCentre'],
      }),
      F('idMaterielPedagogique', 'Matériel pédagogique', 'select', {
        required: true,
        optionsApiPath: '/api/materielpedagogiques',
        optionValueKey: 'id',
        optionLabelKeys: ['libelleMaterielPedagogique'],
      }),
      F('libelleAutreMateriel', 'Libellé autre matériel', 'text', {
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'materielpedagogique',
    title: 'Matériel pédagogique',
    menuGroup: 'pedagogie',
    apiPath: '/api/materielpedagogiques',
    createFields: [
      F('libelleMaterielPedagogique', 'Libellé', 'text', {
        required: true,
        maxLength: 50,
      }),
    ],
  },
  {
    path: 'manuel',
    title: 'Manuels',
    menuGroup: 'activites-centre',
    apiPath: '/api/manuels',
    createFields: [
      F('libelleManuel', 'Libellé manuel', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'ministere',
    title: 'Ministères',
    menuGroup: 'others',
    apiPath: '/api/ministeres',
    createFields: [
      F('idPromoteur', 'Personne morale (promoteur)', 'select', {
        required: true,
        optionsApiPath: '/api/personnemorale',
        optionValueKey: 'id',
        optionLabelKeys: ['codePromoteur', 'libellePromoteur', 'denomination'],
      }),
      F('libelleMinistere', 'Libellé ministère', 'text', { maxLength: 100 }),
      F('libellePromoteur', 'Libellé promoteur', 'text', { maxLength: 100 }),
      F('denomination', 'Dénomination', 'text', { maxLength: 100 }),
      F('nomProgramme', 'Nom programme', 'text', { maxLength: 100 }),
      F(
        'nomRepresentantLegalStructure',
        'Représentant légal',
        'text',
        { maxLength: 100 },
      ),
      F('contact', 'Contact', 'text', { maxLength: 10 }),
      F('boitePostale', 'Boîte postale', 'text', { maxLength: 100 }),
      F('mail', 'Mail', 'text', { maxLength: 100 }),
    ],
  },
  {
    path: 'modealpha',
    title: 'Modes alpha',
    menuGroup: 'pedagogie',
    apiPath: '/api/modealpha',
    createFields: [
      F('idCentre', 'Centre alpha', 'select', {
        required: true,
        optionsApiPath: '/api/alpha',
        optionValueKey: 'idCentre',
        optionLabelKeys: ['codeType', 'libelle', 'codeCentre'],
      }),
      F('libelleModealpha', 'Libellé mode', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'naturecentre',
    title: 'Natures de centre',
    menuGroup: 'centres-autorisations',
    apiPath: '/api/naturecentre',
    createFields: [
      F('libelleNatureCentre', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'naturedocument',
    title: 'Natures de document',
    menuGroup: 'documents',
    apiPath: '/api/naturedocument',
    createFields: [
      F('libelleNatureDocument', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'niveaualpha',
    title: 'Niveaux alpha',
    menuGroup: 'pedagogie',
    apiPath: '/api/niveaualpha',
    createFields: [
      F('idCentre', 'Centre alpha', 'select', {
        required: true,
        optionsApiPath: '/api/alpha',
        optionValueKey: 'idCentre',
        optionLabelKeys: ['codeType', 'libelle', 'codeCentre'],
      }),
      F('libelleNiveauAlpha', 'Libellé niveau', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'niveaucp',
    title: 'Niveaux CP',
    menuGroup: 'pedagogie',
    apiPath: '/api/niveaucp',
    createFields: [
      F('libelleNiveauCp', 'Libellé', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'niveaucontrole',
    title: 'Niveaux de contrôle',
    menuGroup: 'activites-centre',
    apiPath: '/api/niveaux-controle',
    createFields: [
      F('libelleNiveauControle', 'Libellé niveau contrôle', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'periodeevaluation',
    title: 'Périodes d’évaluation',
    menuGroup: 'activites-centre',
    apiPath: '/api/periodes-evaluation',
    createFields: [
      F('libellePeriodeEvaluation', 'Libellé période', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'niveauevaluation',
    title: 'Niveaux d’évaluation',
    menuGroup: 'activites-centre',
    apiPath: '/api/niveaux-evaluation',
    createFields: [
      F('libelleNiveauEvaluation', 'Libellé niveau évaluation', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'themeevaluation',
    title: 'Thèmes d’évaluation',
    menuGroup: 'activites-centre',
    apiPath: '/api/themes-evaluation',
    createFields: [
      F('libelleThemeEvaluation', 'Libellé thème', 'text', {
        required: true,
        maxLength: 200,
      }),
      F('niveau', 'Niveau rattaché', 'select', {
        required: true,
        options: [
          { value: 'NIVEAU_1', label: 'Niveau 1' },
          { value: 'NIVEAU_2', label: 'Niveau 2' },
          { value: 'POST_ALPHA', label: 'Post Alpha' },
        ],
      }),
    ],
    columnLabels: {
      niveau: 'Niveau rattaché',
    },
  },
  {
    path: 'aspectaameliorer',
    title: 'Aspects à améliorer',
    menuGroup: 'activites-centre',
    apiPath: '/api/aspects-a-ameliorer',
    createFields: [
      F('libelleAspectAAmeliorer', 'Libellé aspect à améliorer', 'text', {
        required: true,
        maxLength: 200,
      }),
    ],
  },
  {
    path: 'niveausiecec',
    title: 'Niveaux SIE / CEC',
    menuGroup: 'pedagogie',
    apiPath: '/api/niveausiecec',
    createFields: [
      F('libelleNiveauSie', 'Libellé', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'partenaire',
    title: 'Partenaires',
    menuGroup: 'others',
    apiPath: '/api/Partenaires',
    createFields: [
      F('libellePartenaire', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'periodeactivite',
    title: 'Périodes d’activité',
    menuGroup: 'others',
    apiPath: '/api/PeriodeActivites',
    createFields: [
      F('libellePeriodeActivite', 'Libellé', 'text', {
        required: true,
        maxLength: 50,
      }),
    ],
  },
  {
    path: 'periodicite',
    title: 'Périodicités',
    menuGroup: 'centres-autorisations',
    apiPath: '/api/Periodicites',
    createFields: [
      F('libellePeriodicite', 'Libellé', 'text', {
        required: true,
        maxLength: 15,
      }),
    ],
  },
  {
    path: 'regimealpha',
    title: 'Régimes d’alphabétisation',
    menuGroup: 'pedagogie',
    apiPath: '/api/Regimealphabetisations',
    createFields: [
      F('libelleRegimeAlpha', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'statutpersonnel',
    title: 'Statuts personnel',
    menuGroup: 'others',
    apiPath: '/api/StatutPersonnels',
    createFields: [
      F('libelleStatutPersonnel', 'Libellé', 'text', {
        required: true,
        maxLength: 50,
      }),
    ],
  },
  {
    path: 'supportdidactique',
    title: 'Supports didactiques',
    menuGroup: 'pedagogie',
    apiPath: '/api/SupportDidactiques',
    createFields: [
      F('libelleSupportDidactique', 'Libellé', 'text', {
        required: true,
        maxLength: 50,
      }),
    ],
  },
  {
    path: 'typealpha',
    title: 'Types alpha',
    menuGroup: 'pedagogie',
    apiPath: '/api/TypeAlphas',
    createFields: [
      F('libelleTypeAlpha', 'Libellé', 'text', {
        required: true,
        maxLength: 50,
      }),
    ],
  },
  {
    path: 'typedocument',
    title: 'Types de document',
    menuGroup: 'documents',
    apiPath: '/api/TypeDocuments',
    createFields: [
      F('libelleTypeDocument', 'Libellé', 'text', {
        required: true,
        maxLength: 100,
      }),
    ],
  },
  {
    path: 'localite-d-implantation',
    title: 'Localités d’implantation',
    menuGroup: 'geographie',
    apiPath: '/api/localite-d-implantation',
    createFields: [
      F('idSousPrefecture', 'Sous-préfecture', 'select', {
        required: true,
        optionsApiPath: '/api/sous-prefecture',
        optionValueKey: 'id',
        optionLabelKeys: ['codeSousPrefecture', 'nomSousPrefecture'],
      }),
      F('idMilieuImplentation', 'Milieu d’implantation', 'select', {
        required: true,
        optionsApiPath: '/api/milieu-implantation',
        optionValueKey: 'id',
        optionLabelKeys: ['codeMilieuImplentation', 'libelleTypeImplentation'],
      }),
      F('idCommune', 'Commune (optionnel)', 'select', {
        optionsApiPath: '/api/commune',
        optionValueKey: 'id',
        optionLabelKeys: ['codeCommune', 'nomCommune'],
      }),
      F('codeLocalite', 'Code localité (optionnel)', 'text', { maxLength: 10 }),
      F('nomLocalite', 'Nom localité', 'text', { required: true, maxLength: 30 }),
    ],
  },
];
