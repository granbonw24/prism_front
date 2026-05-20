export type CentreType = 'alpha' | 'cec' | 'cp' | 'sie';

export type DossierLiaisonExtraFieldType = 'text' | 'number' | 'select';

export type DossierLiaisonExtraField = {
  key: string;
  label: string;
  type: DossierLiaisonExtraFieldType;
  maxLength?: number;
  /** Liste déroulante : API référentiel (ex. sources de financement). */
  selectOptionsApiPath?: string;
  selectOptionValueKey?: string;
  selectOptionLabelKeys?: string[];
};

export type DossierLiaisonSelectionMode = 'catalog-multi' | 'label-catalog';

export type DossierCentreLiaisonConfig = {
  section: string;
  title: string;
  shortLabel: string;
  apiPath: string;
  /** POST groupé des affectations (défaut : apiPath + '/sync'). */
  syncApiPath?: string;
  fkField: string;
  catalogApiPath: string;
  catalogLabelKeys: string[];
  catalogSelectLabel?: string;
  /** Lignes catalogue dont le libellé/code contient ce token affichent le champ « autre » (comme Infrastructures). */
  otherCatalogTokens?: string[];
  catalogRefKey: string;
  centreRefKey: 'Centre' | 'Alpha';
  alphaOnly?: boolean;
  extraFields?: DossierLiaisonExtraField[];
  selectionMode: DossierLiaisonSelectionMode;
  /** Champ libellé dans les réponses API catalogue (ex. libelleLangue). */
  catalogLabelField?: string;
  /** Bloc « Autre … » : ajout d’un libellé libre à la liste (langues). */
  allowsCustomLabelEntry?: boolean;
  customEntryLabel?: string;
  customEntryPlaceholder?: string;
};

export const DOSSIER_CENTRE_LIAISON_CONFIGS: DossierCentreLiaisonConfig[] = [
  {
    section: 'difficultes',
    title: 'Difficultés du centre',
    shortLabel: 'Difficultés',
    apiPath: '/api/difficulte-alpha',
    fkField: 'idDifficulte',
    catalogApiPath: '/api/difficulte',
    catalogLabelKeys: ['libelleDifficulte', 'codeDifficulte'],
    catalogRefKey: 'Difficulte',
    centreRefKey: 'Centre',
    alphaOnly: true,
    selectionMode: 'catalog-multi',
  },
  {
    section: 'impacts',
    title: 'Impacts du centre',
    shortLabel: 'Impacts',
    apiPath: '/api/impact-alpha',
    fkField: 'idImpact',
    catalogApiPath: '/api/impact',
    catalogLabelKeys: ['libelleImpact', 'codeImpact'],
    catalogRefKey: 'Impact',
    centreRefKey: 'Centre',
    alphaOnly: true,
    selectionMode: 'catalog-multi',
  },
  {
    section: 'competences',
    title: 'Compétences du centre',
    shortLabel: 'Compétences',
    apiPath: '/api/competence-centre',
    fkField: 'idCompetence',
    catalogApiPath: '/api/competence',
    catalogLabelKeys: ['libelleCompetence', 'codeCompetence'],
    catalogRefKey: 'Competence',
    centreRefKey: 'Centre',
    alphaOnly: true,
    selectionMode: 'catalog-multi',
  },
  {
    section: 'infrastructures',
    title: 'Infrastructures du centre',
    shortLabel: 'Infrastructures',
    apiPath: '/api/infrastructure-centre',
    fkField: 'idInfrastructure',
    catalogApiPath: '/api/infrastructure',
    catalogLabelKeys: ['libelleInfrastructure', 'codeInfrastructure'],
    catalogRefKey: 'Infrastructure',
    centreRefKey: 'Centre',
    selectionMode: 'catalog-multi',
    otherCatalogTokens: ['autre'],
    extraFields: [
      { key: 'libelleAutreInfrastructure', label: 'Précision (autre)', type: 'text', maxLength: 100 },
    ],
  },
  {
    section: 'ressources',
    title: 'Ressources financières et matériel',
    shortLabel: 'Ressources fin.',
    apiPath: '/api/ressource-financiere-materiel',
    fkField: 'idDesignation',
    catalogApiPath: '/api/designation',
    catalogLabelKeys: ['libelleDesignation', 'codeDesignation'],
    catalogRefKey: 'Designation',
    centreRefKey: 'Centre',
    selectionMode: 'catalog-multi',
    otherCatalogTokens: ['autre'],
    extraFields: [
      {
        key: 'sourceFinancement',
        label: 'Source de financement',
        type: 'select',
        selectOptionsApiPath: '/api/source-financement',
        selectOptionValueKey: 'code',
        selectOptionLabelKeys: ['libelleSourceFinancement', 'codeSourceFinancement'],
      },
      { key: 'montant', label: 'Montant', type: 'number' },
    ],
  },
  {
    section: 'materiel',
    title: 'Matériel alpha',
    shortLabel: 'Matériel alpha',
    apiPath: '/api/materielalpha',
    fkField: 'idMaterielPedagogique',
    catalogApiPath: '/api/materielpedagogiques',
    catalogLabelKeys: ['libelleMaterielPedagogique', 'codeMaterielPedagogique'],
    catalogRefKey: 'MaterielPedagogique',
    catalogSelectLabel: 'Matériel pédagogique',
    otherCatalogTokens: ['autre'],
    centreRefKey: 'Centre',
    alphaOnly: true,
    selectionMode: 'catalog-multi',
    extraFields: [
      { key: 'libelleAutreMateriel', label: 'Précision (autre)', type: 'text', maxLength: 100 },
    ],
  },
  {
    section: 'langues',
    title: "Langues d'apprentissage",
    shortLabel: 'Langues',
    apiPath: '/api/LangueApprentissages',
    syncApiPath: '/api/LangueApprentissages/sync',
    fkField: 'libelleLangue',
    catalogApiPath: '/api/LangueApprentissages/catalog',
    catalogLabelKeys: ['libelleLangue'],
    catalogRefKey: '',
    centreRefKey: 'Centre',
    alphaOnly: true,
    selectionMode: 'label-catalog',
    catalogLabelField: 'libelleLangue',
    allowsCustomLabelEntry: true,
    customEntryLabel: 'Autre langue (libellé libre)',
    customEntryPlaceholder: 'Saisir une langue non listée',
  },
];

export function liaisonConfigForSection(section: string): DossierCentreLiaisonConfig | undefined {
  return DOSSIER_CENTRE_LIAISON_CONFIGS.find((c) => c.section === section);
}

export function visibleLiaisonSections(centreType: CentreType | null): DossierCentreLiaisonConfig[] {
  return DOSSIER_CENTRE_LIAISON_CONFIGS.filter((c) => {
    if (c.alphaOnly && centreType !== 'alpha') {
      return false;
    }
    return true;
  });
}
