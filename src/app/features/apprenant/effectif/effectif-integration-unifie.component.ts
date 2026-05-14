import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { ActivatedRoute } from '@angular/router';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';
import { Subscription } from 'rxjs';
import {
  EFFECTIF_ADMIS_INTEGRATION_CP_CREATE_FIELDS,
  EFFECTIF_CEPE_CEC_CREATE_FIELDS,
  EFFECTIF_CEPE_CP_CREATE_FIELDS,
  EFFECTIF_INTEGRATION_FORMEL_CP_CREATE_FIELDS,
  EFFECTIF_PROMU_CEC_CREATE_FIELDS,
  EFFECTIF_PROMU_SIE_CREATE_FIELDS,
  EFFECTIF_REVERSE_FORMEL_SIE_CREATE_FIELDS,
} from './effectif-integration-forms.data';

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
  listColumnKeys: string[];
};

type KindOption = { value: IntegrationKind; label: string };

const INTEGRATION_CONFIG: Record<IntegrationKind, IntegrationConfig> = {
  cepeCp: {
    title: 'Apprenant — CEPE (centre CP)',
    apiPath: '/api/effectif-cepe-cp',
    createFields: EFFECTIF_CEPE_CP_CREATE_FIELDS,
    listColumnKeys: [
      'codeEffectifCepeCp',
      'anneeScolaire',
      'centre',
      'effectifCepeCandidatFCp',
      'effectifCepeCandidatHCp',
      'effectifCepeAdmisFCp',
      'effectifCepeAdmisHCp',
    ],
  },
  cepeCec: {
    title: 'Apprenant — CEPE (centres CEC)',
    apiPath: '/api/effectif-cepe-cec',
    createFields: EFFECTIF_CEPE_CEC_CREATE_FIELDS,
    listColumnKeys: [
      'codeEffectifCepeCec',
      'anneeScolaire',
      'centre',
      'cecIdCentre',
      'effectifCepeCandidatFilleCec',
      'effectifCepeCandidatGarconCec',
      'effectifCepeAdmisFilleCec',
      'effectifCepeAdmisGarconCec',
    ],
  },
  admisCp: {
    title: 'Apprenant — Admis intégration (CP)',
    apiPath: '/api/effectif-admis-integration-cp',
    createFields: EFFECTIF_ADMIS_INTEGRATION_CP_CREATE_FIELDS,
    listColumnKeys: [
      'codeEffectifAdmisIntegrationCp',
      'anneeScolaire',
      'centre',
      'niveauCp',
      'effectifAdmisIntegrationCp911IvoirienH',
      'effectifAdmisIntegrationCp911IvoirienF',
      'effectifAdmisIntegrationCpNiveauCp',
    ],
  },
  formelCp: {
    title: 'Apprenant — Intégration formelle (CP)',
    apiPath: '/api/effectif-integration-formel-cp',
    createFields: EFFECTIF_INTEGRATION_FORMEL_CP_CREATE_FIELDS,
    listColumnKeys: [
      'codeEffectifIntegrationFormelCp',
      'anneeScolaire',
      'centre',
      'niveauCp',
      'effectifIntegrationFormelCp911IvoirienH',
      'effectifIntegrationFormelCp911IvoirienF',
      'effectifIntegrationFormelCpNiveauCp',
    ],
  },
  promuSie: {
    title: 'Apprenant — Promu (SIE)',
    apiPath: '/api/effectif-promu-sie',
    createFields: EFFECTIF_PROMU_SIE_CREATE_FIELDS,
    listColumnKeys: [
      'codeEffectifPromuSie',
      'anneeScolaire',
      'niveauSie',
      'effectifPromuSie3IvoirienH',
      'effectifPromuSie3IvoirienF',
      'effectifPromuSieNiveauSie',
    ],
  },
  promuCec: {
    title: 'Apprenant — Promu (CEC)',
    apiPath: '/api/effectif-promu-cec',
    createFields: EFFECTIF_PROMU_CEC_CREATE_FIELDS,
    listColumnKeys: [
      'codeEffectifPromuCec',
      'anneeScolaire',
      'centre',
      'niveauSie',
      'effectifPromuCecMoins3F',
      'effectifPromuCecMoins3H',
      'effectifPromuCecNiveauCec',
    ],
  },
  reverseSie: {
    title: 'Apprenant — Reverse formel (SIE)',
    apiPath: '/api/effectif-reverse-formel-sie',
    createFields: EFFECTIF_REVERSE_FORMEL_SIE_CREATE_FIELDS,
    listColumnKeys: [
      'codeEffectifReverseFormelSie',
      'anneeScolaire',
      'niveauSie',
      'effectifReverseFormelSie3IvoirienH',
      'effectifReverseFormelSie3IvoirienF',
      'effectifReverseFormelSieNiveauSie',
    ],
  },
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
      [inputPermissionFeature]="'SAISIE_DONNEES'"
      [inputWorkflowFeature]="'SAISIE_DONNEES'"
      [inputCreateFields]="activeConfig.createFields"
      [inputEffectifDenseForm]="true"
      [inputListColumnKeys]="activeConfig.listColumnKeys"
      [addFormContextLabel]="'Type d’effectif'"
      [addFormContextValue]="selectedKind"
      [addFormContextOptions]="kindOptions"
      (addFormContextValueChange)="onKindChanged($event)"
    ></app-referentiel-list-page>
  `,
})
export class EffectifIntegrationUnifieComponent implements OnInit, OnDestroy {
  pageSubtitle =
    'CEPE, intégrations CP, promu SIE/CEC et reverse formel SIE — choisissez le type ci-dessous pour charger le bon formulaire et la bonne API.';

  selectedKind: IntegrationKind = 'cepeCp';
  kindOptions: KindOption[] = [];
  private routeSub?: Subscription;

  private readonly allKindOptions: KindOption[] = [
    { value: 'cepeCp', label: 'CEPE — centre CP' },
    { value: 'cepeCec', label: 'CEPE — centres CEC' },
    { value: 'admisCp', label: 'Admis intégration — CP' },
    { value: 'formelCp', label: 'Intégration formelle — CP' },
    { value: 'promuSie', label: 'Promu — SIE' },
    { value: 'promuCec', label: 'Promu — CEC' },
    { value: 'reverseSie', label: 'Reverse formel — SIE' },
  ];

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    this.routeSub = this.route.data.subscribe((data) => {
      const kinds = this.normalizeKinds(data['kinds']);
      this.kindOptions = kinds.length
        ? this.allKindOptions.filter((option) => kinds.includes(option.value))
        : [...this.allKindOptions];
      const initialKind = this.normalizeKind(data['initialKind']) ?? this.kindOptions[0]?.value ?? 'cepeCp';
      this.selectedKind = this.kindOptions.some((option) => option.value === initialKind)
        ? initialKind
        : (this.kindOptions[0]?.value ?? 'cepeCp');
      this.pageSubtitle =
        typeof data['subtitle'] === 'string' && data['subtitle'].trim()
          ? data['subtitle']
          : 'CEPE, intégrations CP, promu SIE/CEC et reverse formel SIE — choisissez le type ci-dessous pour charger le bon formulaire et la bonne API.';
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  onKindChanged(v: string): void {
    const kind = this.normalizeKind(v);
    if (kind && this.kindOptions.some((option) => option.value === kind)) {
      this.selectedKind = kind;
    }
  }

  get activeConfig(): IntegrationConfig {
    return INTEGRATION_CONFIG[this.selectedKind];
  }

  private normalizeKind(value: unknown): IntegrationKind | null {
    return typeof value === 'string' && value in INTEGRATION_CONFIG
      ? (value as IntegrationKind)
      : null;
  }

  private normalizeKinds(value: unknown): IntegrationKind[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => this.normalizeKind(item))
      .filter((item): item is IntegrationKind => item != null);
  }
}
