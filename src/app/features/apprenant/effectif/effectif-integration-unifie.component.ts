import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';
import {
  EFFECTIF_ADMIS_INTEGRATION_CP_CREATE_FIELDS,
  EFFECTIF_CEPE_CEC_CREATE_FIELDS,
  EFFECTIF_CEPE_CP_CREATE_FIELDS,
  EFFECTIF_INTEGRATION_FORMEL_CP_CREATE_FIELDS,
  EFFECTIF_PROMU_CEC_CREATE_FIELDS,
  EFFECTIF_PROMU_SIE_CREATE_FIELDS,
  EFFECTIF_REVERSE_FORMEL_SIE_CREATE_FIELDS,
} from './effectif-integration-forms.data';
import type { ListStatsContext } from '@core/config/list-stats-context.types';
import { integrationListStatsContext } from './effectif-list-stats-context';

type IntegrationKind =
  | 'cepeCp'
  | 'cepeCec'
  | 'admisCp'
  | 'formelCp'
  | 'promuSie'
  | 'promuCec'
  | 'reverseSie';

type IntegrationConfig = {
  title: string;
  apiPath: string;
  createFields: ReferentielFormField[];
};

const INTEGRATION_CONFIG: Record<IntegrationKind, IntegrationConfig> = {
  cepeCp: {
    title: 'Apprenant — CEPE (centre CP)',
    apiPath: '/api/effectif-cepe-cp',
    createFields: EFFECTIF_CEPE_CP_CREATE_FIELDS,
  },
  cepeCec: {
    title: 'Apprenant — CEPE (centres CEC)',
    apiPath: '/api/effectif-cepe-cec',
    createFields: EFFECTIF_CEPE_CEC_CREATE_FIELDS,
  },
  admisCp: {
    title: 'Apprenant — Admis intégration (CP)',
    apiPath: '/api/effectif-admis-integration-cp',
    createFields: EFFECTIF_ADMIS_INTEGRATION_CP_CREATE_FIELDS,
  },
  formelCp: {
    title: 'Apprenant — Intégration formelle (CP)',
    apiPath: '/api/effectif-integration-formel-cp',
    createFields: EFFECTIF_INTEGRATION_FORMEL_CP_CREATE_FIELDS,
  },
  promuSie: {
    title: 'Apprenant — Promu (SIE)',
    apiPath: '/api/effectif-promu-sie',
    createFields: EFFECTIF_PROMU_SIE_CREATE_FIELDS,
  },
  promuCec: {
    title: 'Apprenant — Promu (CEC)',
    apiPath: '/api/effectif-promu-cec',
    createFields: EFFECTIF_PROMU_CEC_CREATE_FIELDS,
  },
  reverseSie: {
    title: 'Apprenant — Reverse formel (SIE)',
    apiPath: '/api/effectif-reverse-formel-sie',
    createFields: EFFECTIF_REVERSE_FORMEL_SIE_CREATE_FIELDS,
  },
};

const INTEGRATION_STATS: Record<IntegrationKind, ListStatsContext> = {
  cepeCp: integrationListStatsContext('cepeCp'),
  cepeCec: integrationListStatsContext('cepeCec'),
  admisCp: integrationListStatsContext('admisCp'),
  formelCp: integrationListStatsContext('formelCp'),
  promuSie: integrationListStatsContext('promuSie'),
  promuCec: integrationListStatsContext('promuCec'),
  reverseSie: integrationListStatsContext('reverseSie'),
};

@Component({
  selector: 'app-effectif-integration-unifie',
  standalone: true,
  imports: [CommonModule, ReferentielListPageComponent],
  template: `
    <app-referentiel-list-page
      [inputTitle]="activeConfig.title"
      [inputSubtitle]="pageSubtitle"
      [inputApiPath]="activeConfig.apiPath"
      [inputCreateFields]="activeConfig.createFields"
      [addFormContextLabel]="'Type d’effectif'"
      [addFormContextValue]="selectedKind"
      [addFormContextOptions]="kindOptions"
      (addFormContextValueChange)="onKindChanged($event)"
    ></app-referentiel-list-page>
  `,
})
export class EffectifIntegrationUnifieComponent {
  readonly pageSubtitle =
    'CEPE, intégrations CP, promu SIE/CEC et reverse formel SIE — choisissez le type ci-dessous pour charger le bon formulaire et la bonne API.';

  selectedKind: IntegrationKind = 'cepeCp';
  readonly kindOptions = [
    { value: 'cepeCp', label: 'CEPE — centre CP' },
    { value: 'cepeCec', label: 'CEPE — centres CEC' },
    { value: 'admisCp', label: 'Admis intégration — CP' },
    { value: 'formelCp', label: 'Intégration formelle — CP' },
    { value: 'promuSie', label: 'Promu — SIE' },
    { value: 'promuCec', label: 'Promu — CEC' },
    { value: 'reverseSie', label: 'Reverse formel — SIE' },
  ];

  onKindChanged(v: string): void {
    if (v in INTEGRATION_CONFIG) {
      this.selectedKind = v as IntegrationKind;
    }
  }

  get activeConfig(): IntegrationConfig {
    return INTEGRATION_CONFIG[this.selectedKind];
  }

  get listStatsContext(): ListStatsContext {
    return INTEGRATION_STATS[this.selectedKind];
  }
}
