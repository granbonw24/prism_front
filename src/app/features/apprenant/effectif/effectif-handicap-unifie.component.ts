import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';
import {
  EFFECTIF_HANDICAP_ALPHA_CREATE_FIELDS,
  EFFECTIF_HANDICAP_CEC_CREATE_FIELDS,
  EFFECTIF_HANDICAP_CP_CREATE_FIELDS,
  EFFECTIF_HANDICAP_SIE_CREATE_FIELDS,
} from './effectif-satellite-forms.data';
import { effectifStatsByCentreType } from './effectif-list-stats-context';
import type { ListStatsContext } from '@core/config/list-stats-context.types';

type HandicapCentreType = 'alpha' | 'cp' | 'cec' | 'sie';

type HandicapConfig = {
  title: string;
  apiPath: string;
  createFields: ReferentielFormField[];
};

const HANDICAP_STATS: Record<HandicapCentreType, ListStatsContext> = {
  alpha: effectifStatsByCentreType('alpha'),
  cp: effectifStatsByCentreType('cp'),
  cec: effectifStatsByCentreType('cec'),
  sie: effectifStatsByCentreType('sie'),
};

const HANDICAP_TYPE_CONFIG: Record<HandicapCentreType, HandicapConfig> = {
  alpha: {
    title: 'Apprenant — Effectif situation handicap (Alpha)',
    apiPath: '/api/effectif-situation-handicap-alpha',
    createFields: EFFECTIF_HANDICAP_ALPHA_CREATE_FIELDS,
  },
  cp: {
    title: 'Apprenant — Effectif situation handicap (CP)',
    apiPath: '/api/effectif-situation-handicap-cp',
    createFields: EFFECTIF_HANDICAP_CP_CREATE_FIELDS,
  },
  cec: {
    title: 'Apprenant — Effectif situation handicap (CEC)',
    apiPath: '/api/effectif-situation-handicap-cec',
    createFields: EFFECTIF_HANDICAP_CEC_CREATE_FIELDS,
  },
  sie: {
    title: 'Apprenant — Effectif situation handicap (SIE)',
    apiPath: '/api/effectif-situation-handicap-sie',
    createFields: EFFECTIF_HANDICAP_SIE_CREATE_FIELDS,
  },
};

@Component({
  selector: 'app-effectif-handicap-unifie',
  standalone: true,
  imports: [CommonModule, ReferentielListPageComponent],
  template: `
    <app-referentiel-list-page
      [inputTitle]="activeConfig.title"
      [inputApiPath]="activeConfig.apiPath"
      [inputCreateFields]="activeConfig.createFields"
      [inputStatsContext]="listStatsContext"
      [addFormContextLabel]="'Type de centre'"
      [addFormContextValue]="selectedType"
      [addFormContextOptions]="centreTypeOptions"
      (addFormContextValueChange)="onTypeChanged($event)"
    ></app-referentiel-list-page>
  `,
})
export class EffectifHandicapUnifieComponent {
  selectedType: HandicapCentreType = 'alpha';
  readonly centreTypeOptions = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'cp', label: 'CP' },
    { value: 'cec', label: 'CEC' },
    { value: 'sie', label: 'SIE' },
  ];

  onTypeChanged(v: string): void {
    if (v === 'alpha' || v === 'cp' || v === 'cec' || v === 'sie') {
      this.selectedType = v;
    }
  }

  get activeConfig(): HandicapConfig {
    return HANDICAP_TYPE_CONFIG[this.selectedType];
  }

  get listStatsContext(): ListStatsContext {
    return HANDICAP_STATS[this.selectedType];
  }
}
