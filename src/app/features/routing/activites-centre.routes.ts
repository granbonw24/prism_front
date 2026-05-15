import { Routes } from '@angular/router';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { ActivitesCentreControleComponent } from '@features/activites-centre/controle/activites-centre-controle.component';
import { DossierCentreComponent } from '@features/activites-centre/dossier-centre/dossier-centre.component';
import { ActivitesCentreEvaluationComponent } from '@features/activites-centre/evaluation/activites-centre-evaluation.component';
import { AlphaCentresComponent } from '@features/centres/alpha/alpha-centres.component';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

const F = (
  key: string,
  label: string,
  type: ReferentielFormField['type'],
  opts?: {
    required?: boolean;
    optionsApiPath?: string;
    optionValueKey?: string;
    optionLabelKeys?: string[];
  },
): ReferentielFormField => ({
  key,
  label,
  type,
  required: opts?.required ?? false,
  optionsApiPath: opts?.optionsApiPath,
  optionValueKey: opts?.optionValueKey,
  optionLabelKeys: opts?.optionLabelKeys,
});

const alphaField = F('idAlpha', 'Centre Alpha', 'select', {
  required: true,
  optionsApiPath: '/api/alpha',
  optionValueKey: 'idCentre',
  optionLabelKeys: ['codeAlpha', 'libelleAlpha', 'codeCentre'],
});

export const activitesCentreFeatureRoutes: Routes = [
  {
    path: 'activites-centre/dossier-centre',
    component: DossierCentreComponent,
    data: {
      title: 'ACTIVITES CENTRE — Dossier centre',
    },
  },
  {
    path: 'activites-centre/partenariat',
    component: ReferentielListPageComponent,
    data: {
      title: 'ACTIVITES CENTRE — Partenariat',
      subtitle: 'Appuis et partenariats rattachés aux centres.',
      apiPath: '/api/appui-partenaire',
      permissionFeature: 'ACTIVITES_CENTRE_PARTENARIAT',
      workflowFeature: 'ACTIVITES_CENTRE_PARTENARIAT',
      listColumnKeys: ['centre', 'partenaire', 'categorieAppui', 'codeAppuiPartenaire', 'libelleAppuiPartenaire'],
      createFields: [
        F('idCentre', 'Centre', 'select', {
          required: true,
          optionsApiPath: '/api/centres',
          optionValueKey: 'id',
          optionLabelKeys: ['codeCentre', 'localisationCentre'],
        }),
        F('idPartenaire', 'Partenaire', 'select', {
          required: true,
          optionsApiPath: '/api/Partenaires',
          optionValueKey: 'id',
          optionLabelKeys: ['codePartenaire', 'libellePartenaire'],
        }),
        F('idCategorieAppui', 'Catégorie appui', 'select', {
          required: true,
          optionsApiPath: '/api/categorieappuis',
          optionValueKey: 'id',
          optionLabelKeys: ['codeCategorieAppui', 'libelleCategorieAppui'],
        }),
        F('libelleAppuiPartenaire', 'Libellé appui', 'text', { required: true }),
      ],
    },
  },
  {
    path: 'activites-centre/performance',
    component: ReferentielListPageComponent,
    data: {
      title: 'ACTIVITES CENTRE — Performance',
      subtitle: 'Fréquentation et progression des apprentissages par centre Alpha.',
      apiPath: '/api/performance',
      permissionFeature: 'ACTIVITES_CENTRE_PERFORMANCE',
      workflowFeature: 'ACTIVITES_CENTRE_PERFORMANCE',
      listColumnKeys: [
        'alpha',
        'periodeActivite',
        'tauxFrequentationParMois',
        'tauxProgressionApprentissageLecture',
        'tauxProgressionApprentissageEcriture',
        'tauxProgressionApprentissageCalcul',
        'tauxProgressionApprentissageCvc',
      ],
      createFields: [
        alphaField,
        F('idPeriodeActivite', 'Période d’activité', 'select', {
          required: true,
          optionsApiPath: '/api/PeriodeActivites',
          optionValueKey: 'id',
          optionLabelKeys: ['codePeriodeActivite', 'libellePeriodeActivite'],
        }),
        F('tauxFrequentationParMois', 'Taux fréquentation par mois', 'text'),
        F('tauxProgressionApprentissageLecture', 'Progression lecture', 'text'),
        F('tauxProgressionApprentissageEcriture', 'Progression écriture', 'text'),
        F('tauxProgressionApprentissageCalcul', 'Progression calcul', 'text'),
        F('tauxProgressionApprentissageCvc', 'Progression CVC', 'text'),
      ],
    },
  },
  {
    path: 'activites-centre/controle',
    component: ActivitesCentreControleComponent,
    data: {
      title: 'ACTIVITES CENTRE — Contrôle',
    },
  },
  {
    path: 'activites-centre/evaluation-periodique',
    component: ActivitesCentreEvaluationComponent,
    data: {
      title: 'ACTIVITES CENTRE — Évaluation périodique',
    },
  },
  {
    path: 'activites-centre/informations-centres',
    component: AlphaCentresComponent,
    data: {
      title: 'ACTIVITES CENTRE — Informations centres',
      subtitle: 'Vue synthétique des centres Alpha, avec détail complet et actions.',
      createInitiallyOpen: false,
    },
  },
];
