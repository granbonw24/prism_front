import { Routes } from '@angular/router';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { ActivitesCentreControleComponent } from '@features/activites-centre/controle/activites-centre-controle.component';
import { ActivitesCentreEvaluationComponent } from '@features/activites-centre/evaluation/activites-centre-evaluation.component';
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
    path: 'activites-centre/partenariat',
    component: ReferentielListPageComponent,
    data: {
      title: 'ACTIVITES CENTRE — Partenariat',
      subtitle: 'Appuis et partenariats rattachés aux centres.',
      apiPath: '/api/appui-partenaire',
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
      createFields: [
        alphaField,
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
    component: ReferentielListPageComponent,
    data: {
      title: 'ACTIVITES CENTRE — Informations centres',
      subtitle: 'Liste des centres Alpha concernés par les activités centre.',
      apiPath: '/api/alpha',
      createFields: [],
    },
  },
];
