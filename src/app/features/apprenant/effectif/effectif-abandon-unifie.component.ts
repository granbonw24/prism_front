import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';
import {
  EFFECTIF_ABANDON_ALPHA_CREATE_FIELDS,
  EFFECTIF_ABANDON_CEC_CREATE_FIELDS,
  EFFECTIF_ABANDON_CP_CREATE_FIELDS,
  EFFECTIF_ABONDAN_SIE_CREATE_FIELDS,
} from './effectif-satellite-forms.data';
import { effectifStatsByCentreType } from './effectif-list-stats-context';
import type { ListStatsContext } from '@core/config/list-stats-context.types';

type AbandonCentreType = 'alpha' | 'cp' | 'cec' | 'sie';

type AbandonConfig = {
  title: string;
  apiPath: string;
  createFields: ReferentielFormField[];
};

const ABANDON_STATS: Record<AbandonCentreType, ListStatsContext> = {
  alpha: effectifStatsByCentreType('alpha'),
  cp: effectifStatsByCentreType('cp'),
  cec: effectifStatsByCentreType('cec'),
  sie: effectifStatsByCentreType('sie'),
};

const ABANDON_TYPE_CONFIG: Record<AbandonCentreType, AbandonConfig> = {
  alpha: {
    title: 'Apprenant — Effectif abandon (Alpha)',
    apiPath: '/api/effectif-abandon-alpha',
    createFields: EFFECTIF_ABANDON_ALPHA_CREATE_FIELDS,
  },
  cp: {
    title: 'Apprenant — Effectif abandon (CP)',
    apiPath: '/api/effectif-abandon-cp',
    createFields: EFFECTIF_ABANDON_CP_CREATE_FIELDS,
  },
  cec: {
    title: 'Apprenant — Effectif abandon (CEC)',
    apiPath: '/api/effectif-abandon-cec',
    createFields: EFFECTIF_ABANDON_CEC_CREATE_FIELDS,
  },
  sie: {
    title: 'Apprenant — Effectif abandon (SIE)',
    apiPath: '/api/effectif-abondan-sie',
    createFields: EFFECTIF_ABONDAN_SIE_CREATE_FIELDS,
  },
};

@Component({
  selector: 'app-effectif-abandon-unifie',
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
export class EffectifAbandonUnifieComponent {
  selectedType: AbandonCentreType = 'alpha';
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

  get activeConfig(): AbandonConfig {
    return ABANDON_TYPE_CONFIG[this.selectedType];
  }

  get listStatsContext(): ListStatsContext {
    return ABANDON_STATS[this.selectedType];
  }
}
