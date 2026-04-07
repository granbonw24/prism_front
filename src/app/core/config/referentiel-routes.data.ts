import type { ReferentielFormField } from '@core/config/referentiel-form.types';

/**
 * Correspondance routes Angular ↔ chemins API Spring (`@RequestMapping`).
 * `createFields` : formulaire « Ajouter » (POST JSON). Vide = modal d’information seulement.
 * Les champs **code** métier sont générés côté API (`@AutoCode` + `CodeGeneratorService`) si non envoyés.
 */
export interface ReferentielRouteData {
  path: string;
  title: string;
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
    optionValueKey?: string;
    optionLabelKeys?: string[];
  },
): ReferentielFormField => ({
  key,
  label,
  type,
  required: opts?.required ?? false,
  maxLength: opts?.maxLength,
  optionsApiPath: opts?.optionsApiPath,
  optionValueKey: opts?.optionValueKey,
  optionLabelKeys: opts?.optionLabelKeys,
});

export const REFERENTIEL_ROUTE_DATA: ReferentielRouteData[] = [
  {
    path: 'anneescolaire',
    title: 'Années scolaires',
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
    apiPath: '/api/civilite',
    createFields: [
      F('libelleCivilite', 'Libellé', 'text', { required: true, maxLength: 10 }),
    ],
  },
  {
    path: 'communaute',
    title: 'Communautés',
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
    apiPath: '/api/competence',
    createFields: [
      F('libelleCompetence', 'Libellé', 'text', { required: true, maxLength: 20 }),
    ],
  },
  {
    path: 'designation',
    title: 'Désignations',
    apiPath: '/api/designation',
    createFields: [
      F('libelleDesignation', 'Libellé', 'text', { required: true, maxLength: 50 }),
    ],
  },
  {
    path: 'difficulte',
    title: 'Difficultés',
    apiPath: '/api/difficulte',
    createFields: [
      F('libelleDifficulte', 'Libellé', 'text', { required: true, maxLength: 50 }),
    ],
  },
  {
    path: 'diplome',
    title: 'Diplômes',
    apiPath: '/api/diplome',
    createFields: [
      F('libelleDiplome', 'Libellé', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'document',
    title: 'Documents',
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
        optionsApiPath: '/api/v1/TypeDocuments',
        optionValueKey: 'id',
        optionLabelKeys: ['codeTypeDocument', 'libelleTypeDocument'],
      }),
      F('idCentre', 'Centre alpha', 'select', {
        required: true,
        optionsApiPath: '/api/v1/alpha',
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
    path: 'domaineactivite',
    title: 'Domaines d’activité',
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
    apiPath: '/api/v1/fonctions',
    createFields: [
      F('libelleFonction', 'Libellé', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'impact',
    title: 'Impacts',
    apiPath: '/api/impact',
    createFields: [
      F('libelleImpact', 'Libellé', 'text', { required: true, maxLength: 50 }),
    ],
  },
  {
    path: 'infrastructure',
    title: 'Infrastructures',
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
    apiPath: '/api/v1/LangueApprentissages',
    createFields: [
      F('idCentre', 'Centre', 'select', {
        required: true,
        optionsApiPath: '/api/v1/centres',
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
    apiPath: '/api/materielalpha',
    createFields: [
      F('idCentre', 'Centre alpha', 'select', {
        required: true,
        optionsApiPath: '/api/v1/alpha',
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
    apiPath: '/api/materielpedagogiques',
    createFields: [
      F('libelleMaterielPedagogique', 'Libellé', 'text', {
        required: true,
        maxLength: 50,
      }),
    ],
  },
  {
    path: 'ministere',
    title: 'Ministères',
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
    apiPath: '/api/modealpha',
    createFields: [
      F('idCentre', 'Centre alpha', 'select', {
        required: true,
        optionsApiPath: '/api/v1/alpha',
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
    apiPath: '/api/niveaualpha',
    createFields: [
      F('idCentre', 'Centre alpha', 'select', {
        required: true,
        optionsApiPath: '/api/v1/alpha',
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
    apiPath: '/api/niveaucp',
    createFields: [
      F('libelleNiveauCp', 'Libellé', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'niveausiecec',
    title: 'Niveaux SIE / CEC',
    apiPath: '/api/niveausiecec',
    createFields: [
      F('libelleNiveauSie', 'Libellé', 'text', { required: true, maxLength: 100 }),
    ],
  },
  {
    path: 'partenaire',
    title: 'Partenaires',
    apiPath: '/api/v1/Partenaires',
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
    apiPath: '/api/v1/PeriodeActivites',
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
    apiPath: '/api/v1/Periodicites',
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
    apiPath: '/api/v1/Regimealphabetisations',
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
    apiPath: '/api/v1/StatutPersonnels',
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
    apiPath: '/api/v1/SupportDidactiques',
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
    apiPath: '/api/v1/TypeAlphas',
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
    apiPath: '/api/v1/TypeDocuments',
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
