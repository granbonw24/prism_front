import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

type CentreType = 'alpha' | 'cec' | 'cp' | 'sie';
type EffectifTypeConfig = {
  title: string;
  apiPath: string;
  createFields: ReferentielFormField[];
};

/**
 * Colonnes liste : identifiants métier, rattachements et totaux principaux.
 * Le détail par tranches d’âge / handicap reste dans le formulaire (édition).
 */
const EFFECTIF_LIST_SUMMARY_COLUMNS: Record<CentreType, string[]> = {
  alpha: [
    'codeEffectifAlpha',
    'periodeActivite',
    'alpha',
    'niveauAlpha',
    'effectifAlphaNiveauH',
    'effectifAlphaNiveauF',
  ],
  cec: [
    'codeEffectifCec',
    'periodeActivite',
    'centre',
    'niveauSie',
    'effectifCecNiveauCec',
  ],
  cp: [
    'codeEffectifCp',
    'anneeScolaire',
    'centre',
    'niveauCp',
    'effectifCpNiveauCp',
  ],
  sie: ['codeEffectifSie', 'anneeScolaire', 'niveauSie', 'effectifSieNiveauSie'],
};

@Component({
  selector: 'app-effectif-centre-unifie',
  standalone: true,
  imports: [CommonModule, ReferentielListPageComponent],
  template: `
    <app-referentiel-list-page
      [inputTitle]="activeConfig.title"
      [inputApiPath]="activeConfig.apiPath"
      [inputPermissionFeature]="'SAISIE_DONNEES'"
      [inputWorkflowFeature]="'SAISIE_DONNEES'"
      [inputCreateFields]="activeConfig.createFields"
      [inputListColumnKeys]="listColumnKeys"
      [inputEffectifDenseForm]="true"
      [inputShowToolbarCentreTypeFilter]="true"
      inputContextDashboardModule="APPRENANT"
      inputContextDashboardSubModule="effectif"
      [inputContextDashboardAlwaysVisible]="true"
      [addFormContextLabel]="'Type de centre'"
      [addFormContextValue]="selectedType"
      [addFormContextOptions]="centreTypeOptions"
      (addFormContextValueChange)="onTypeChanged($event)"
    ></app-referentiel-list-page>
  `,
})
export class EffectifCentreUnifieComponent {
  selectedType: CentreType = 'alpha';
  readonly centreTypeOptions = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'cec', label: 'CEC' },
    { value: 'cp', label: 'CP' },
    { value: 'sie', label: 'SIE' },
  ];

  onTypeChanged(v: string): void {
    if (v === 'alpha' || v === 'cec' || v === 'cp' || v === 'sie') {
      this.selectedType = v;
    }
  }

  get activeConfig(): EffectifTypeConfig {
    return EFFECTIF_TYPE_CONFIG[this.selectedType];
  }

  get listColumnKeys(): string[] {
    return EFFECTIF_LIST_SUMMARY_COLUMNS[this.selectedType];
  }
}

const EFFECTIF_COMMON_ALPHA: ReferentielFormField[] = [
  { key: 'idPeriodeActivite', label: 'Période activité', type: 'select', required: true, optionsApiPath: '/api/PeriodeActivites', optionValueKey: 'id', optionLabelKeys: ['code', 'libelle'] },
  { key: 'idCentre', label: 'Centre', type: 'select', required: true, optionsApiPath: '/api/alpha', optionValueKey: 'idCentre', optionLabelKeys: ['codeType', 'libelle', 'codeCentre'] },
  { key: 'idNiveauAlpha', label: 'Niveau Alpha', type: 'select', required: true, optionsApiPath: '/api/niveaualpha', optionValueKey: 'id', optionLabelKeys: ['codeNiveauAlpha', 'libelleNiveauAlpha'] },
  { key: 'effectifAlphaNiveauH', label: 'Effectif niveau H', type: 'number' },
  { key: 'effectifAlphaNiveauF', label: 'Effectif niveau F', type: 'number' },
  { key: 'effectifAlphaMoins15F', label: 'Moins 15 F', type: 'number' },
  { key: 'effectifAlphaMoins15H', label: 'Moins 15 H', type: 'number' },
  { key: 'effectifAlphaMoins15IvoirienH', label: 'Moins 15 Ivoirien H', type: 'number' },
  { key: 'effectifAlphaMoins15IvoirienF', label: 'Moins 15 Ivoirien F', type: 'number' },
  { key: 'effectifAlphaMoins15HandicapH', label: 'Moins 15 Handicap H', type: 'number' },
  { key: 'effectifAlphaMoins15HandicapF', label: 'Moins 15 Handicap F', type: 'number' },
  { key: 'effectifAlpha1524F', label: '15-24 F', type: 'number' },
  { key: 'effectifAlpha1524H', label: '15-24 H', type: 'number' },
  { key: 'effectifAlpha1524IvoirienH', label: '15-24 Ivoirien H', type: 'number' },
  { key: 'effectifAlpha1524IvoirienF', label: '15-24 Ivoirien F', type: 'number' },
  { key: 'effectifAlpha1524HandicapH', label: '15-24 Handicap H', type: 'number' },
  { key: 'effectifAlpha1524HandicapF', label: '15-24 Handicap F', type: 'number' },
  { key: 'effectifAlpha2549F', label: '25-49 F', type: 'number' },
  { key: 'effectifAlpha2549H', label: '25-49 H', type: 'number' },
  { key: 'effectifAlpha2549IvoirienF', label: '25-49 Ivoirien F', type: 'number' },
  { key: 'effectifAlpha2549IvoirienH', label: '25-49 Ivoirien H', type: 'number' },
  { key: 'effectifAlpha2549HandicapH', label: '25-49 Handicap H', type: 'number' },
  { key: 'effectifAlpha2549HandicapF', label: '25-49 Handicap F', type: 'number' },
  { key: 'effectifAlpha50PlusF', label: '50+ F', type: 'number' },
  { key: 'effectifAlpha50PlusH', label: '50+ H', type: 'number' },
  { key: 'effectifAlpha50PlusIvoirienH', label: '50+ Ivoirien H', type: 'number' },
  { key: 'effectifAlpha50PlusIvoirienF', label: '50+ Ivoirien F', type: 'number' },
  { key: 'effectifAlpha50PlusHandicapH', label: '50+ Handicap H', type: 'number' },
  { key: 'effectifAlpha50PlusHandicapF', label: '50+ Handicap F', type: 'number' },
];

const EFFECTIF_COMMON_CEC: ReferentielFormField[] = [
  { key: 'idPeriodeActivite', label: 'Période activité', type: 'select', required: true, optionsApiPath: '/api/PeriodeActivites', optionValueKey: 'id', optionLabelKeys: ['code', 'libelle'], payloadAsObjectId: true },
  { key: 'idNiveauSie', label: 'Niveau CEC/SIE', type: 'select', required: true, optionsApiPath: '/api/niveausiecec', optionValueKey: 'id', optionLabelKeys: ['libelleNiveauSie'], payloadAsObjectId: true },
  { key: 'idCentre', label: 'Centre', type: 'select', required: true, optionsApiPath: '/api/cec', optionValueKey: 'idCentre', optionLabelKeys: ['codeType', 'libelle', 'codeCentre'], payloadAsObjectId: true },
  { key: 'effectifCecMoins3F', label: 'Moins 3 F', type: 'number' },
  { key: 'effectifCecMoins3H', label: 'Moins 3 H', type: 'number' },
  { key: 'effectifCec35F', label: '3-5 F', type: 'number' },
  { key: 'effectifCec35H', label: '3-5 H', type: 'number' },
  { key: 'effectifCec68F', label: '6-8 F', type: 'number' },
  { key: 'effectifCec68H', label: '6-8 H', type: 'number' },
  { key: 'effectifCecMoins3IvoirienH', label: 'Moins 3 Ivoirien H', type: 'number' },
  { key: 'effectifCecMoins3IvoirienF', label: 'Moins 3 Ivoirien F', type: 'number' },
  { key: 'effectifCecMoins3HandicapH', label: 'Moins 3 Handicap H', type: 'number' },
  { key: 'effectifCecMoins3HandicapF', label: 'Moins 3 Handicap F', type: 'number' },
  { key: 'effectifCec35IvoirienH', label: '3-5 Ivoirien H', type: 'number' },
  { key: 'effectifCec35IvoirienF', label: '3-5 Ivoirien F', type: 'number' },
  { key: 'effectifCec35HandicapH', label: '3-5 Handicap H', type: 'number' },
  { key: 'effectifCec35HandicapF', label: '3-5 Handicap F', type: 'number' },
  { key: 'effectifCec68IvoirienF', label: '6-8 Ivoirien F', type: 'number' },
  { key: 'effectifCec68IvoirienH', label: '6-8 Ivoirien H', type: 'number' },
  { key: 'effectifCec68HandicapH', label: '6-8 Handicap H', type: 'number' },
  { key: 'effectifCec68HandicapF', label: '6-8 Handicap F', type: 'number' },
  { key: 'effectifCec911F', label: '9-11 F', type: 'number' },
  { key: 'effectifCec911H', label: '9-11 H', type: 'number' },
  { key: 'effectifCec911IvoirienH', label: '9-11 Ivoirien H', type: 'number' },
  { key: 'effectifCec911IvoirienF', label: '9-11 Ivoirien F', type: 'number' },
  { key: 'effectifCec911HandicapH', label: '9-11 Handicap H', type: 'number' },
  { key: 'effectifCec911HandicapF', label: '9-11 Handicap F', type: 'number' },
  { key: 'effectifCec1216F', label: '12-16 F', type: 'number' },
  { key: 'effectifCec1216H', label: '12-16 H', type: 'number' },
  { key: 'effectifCec1216IvoirienH', label: '12-16 Ivoirien H', type: 'number' },
  { key: 'effectifCec1216IvoirienF', label: '12-16 Ivoirien F', type: 'number' },
  { key: 'effectifCec1216HandicapH', label: '12-16 Handicap H', type: 'number' },
  { key: 'effectifCec1216HandicapF', label: '12-16 Handicap F', type: 'number' },
  { key: 'effectifCecNiveauCec', label: 'Effectif niveau CEC', type: 'number' },
];

const EFFECTIF_COMMON_CP: ReferentielFormField[] = [
  { key: 'idAnneeScolaire', label: 'Année scolaire', type: 'select', required: true, optionsApiPath: '/api/anneescolaire', optionValueKey: 'id', optionLabelKeys: ['debutAnneeScolaire', 'finAnneeScolaire'], payloadAsObjectId: true },
  { key: 'idNiveauCp', label: 'Niveau CP', type: 'select', required: true, optionsApiPath: '/api/niveaucp', optionValueKey: 'id', optionLabelKeys: ['libelleNiveauCp'], payloadAsObjectId: true },
  { key: 'idCentre', label: 'Centre', type: 'select', required: true, optionsApiPath: '/api/cp', optionValueKey: 'idCentre', optionLabelKeys: ['codeType', 'libelle', 'codeCentre'], payloadAsObjectId: true },
  { key: 'effectifCp911IvoirienH', label: '9-11 Ivoirien Garçon', type: 'number' },
  { key: 'effectifCp911IvoirienF', label: '9-11 Ivoirienne Fille', type: 'number' },
  { key: 'effectifCp1213IvoirienH', label: '12-13 Ivoirien Garçon', type: 'number' },
  { key: 'effectifCp1213IvoirienF', label: '12-13 Ivoirienne Fille', type: 'number' },
  { key: 'effectifCp14IvoirienH', label: '14 Ivoirien Garçon', type: 'number' },
  { key: 'effectifCp14IvoirienF', label: '14 Ivoirienne Fille', type: 'number' },
  { key: 'effectifCp911HandicapH', label: '9-11 Handicap Garçon', type: 'number' },
  { key: 'effectifCp911HandicapF', label: '9-11 Handicap Fille', type: 'number' },
  { key: 'effectifCp911NonIvoirienF', label: '9-11 Non Ivoirienne Fille', type: 'number' },
  { key: 'effectifCp911NonIvoirienH', label: '9-11 Non Ivoirien Garçon', type: 'number' },
  { key: 'effectifCp1213HandicapH', label: '12-13 Handicap Garçon', type: 'number' },
  { key: 'effectifCp1213HandicapF', label: '12-13 Handicap Fille', type: 'number' },
  { key: 'effectifCp1213NonIvoiriienH', label: '12-13 Non Ivoirien Garçon', type: 'number' },
  { key: 'effectifCp1213NonIvoiriienF', label: '12-13 Non Ivoirienne Fille', type: 'number' },
  { key: 'effectifCp14HandicapH', label: '14 Handicap Garçon', type: 'number' },
  { key: 'effectifCp14HandicapF', label: '14 Handicap Fille', type: 'number' },
  { key: 'effectifCp14NonIvoirienF', label: '14 Non Ivoirienne Fille', type: 'number' },
  { key: 'effectifCp14NonIvoirienH', label: '14 Non Ivoirien Garçon', type: 'number' },
  { key: 'effectifCpNiveauCp', label: 'Effectif total', type: 'number' },
];

const EFFECTIF_COMMON_SIE: ReferentielFormField[] = [
  { key: 'idAnneeScolaire', label: 'Année scolaire', type: 'select', required: true, optionsApiPath: '/api/anneescolaire', optionValueKey: 'id', optionLabelKeys: ['debutAnneeScolaire', 'finAnneeScolaire'], payloadAsObjectId: true },
  { key: 'idNiveauSie', label: 'Niveau SIE', type: 'select', required: true, optionsApiPath: '/api/niveausiecec', optionValueKey: 'id', optionLabelKeys: ['libelleNiveauSie'], payloadAsObjectId: true },
  { key: 'idCentre', label: 'Centre', type: 'select', required: true, optionsApiPath: '/api/sie', optionValueKey: 'idCentre', optionLabelKeys: ['codeType', 'libelle', 'codeCentre'], payloadAsObjectId: true },
  { key: 'effectifSie3IvoirienH', label: '3 Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie3IvoirienF', label: '3 Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie46IvoirienH', label: '4-6 Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie46IvoirienF', label: '4-6 Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie79IvoirienH', label: '7-9 Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie79IvoirienF', label: '7-9 Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie3HandicapH', label: '3 Handicap Garçon', type: 'number' },
  { key: 'effectifSie3HandicapF', label: '3 Handicap Fille', type: 'number' },
  { key: 'effectifSie3NonIvoirienF', label: '3 Non Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie3NonIvoirienH', label: '3 Non Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie46HandicapH', label: '4-6 Handicap Garçon', type: 'number' },
  { key: 'effectifSie46HandicapF', label: '4-6 Handicap Fille', type: 'number' },
  { key: 'effectifSie46NonIvoiriienH', label: '4-6 Non Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie46NonIvoiriienF', label: '4-6 Non Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie79HandicapH', label: '7-9 Handicap Garçon', type: 'number' },
  { key: 'effectifSie79HandicapF', label: '7-9 Handicap Fille', type: 'number' },
  { key: 'effectifSie79NonIvoirienF', label: '7-9 Non Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie79NonIvoirienH', label: '7-9 Non Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie1012IvoirienF', label: '10-12 Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie1012IvoirienH', label: '10-12 Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie1012HandicapH', label: '10-12 Handicap Garçon', type: 'number' },
  { key: 'effectifSie1012HandicapF', label: '10-12 Handicap Fille', type: 'number' },
  { key: 'effectifSie1012NonIvoirienH', label: '10-12 Non Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie1012NonIvoirienF', label: '10-12 Non Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie1314EtPlusIvoirienF', label: '13-14+ Ivoirienne Fille', type: 'number' },
  { key: 'effectifSie1314EtPlusIvoirienH', label: '13-14+ Ivoirien Garçon', type: 'number' },
  { key: 'effectifSie1314EtPlusHandicapF', label: '13-14+ Handicap Fille', type: 'number' },
  { key: 'effectifSie1314EtPlusHandicapH', label: '13-14+ Handicap Garçon', type: 'number' },
  { key: 'effectifSieNiveauSie', label: 'Effectif total', type: 'number' },
];

const EFFECTIF_TYPE_CONFIG: Record<CentreType, EffectifTypeConfig> = {
  alpha: { title: 'Apprenant - Effectif Alpha', apiPath: '/api/effectif-alpha', createFields: EFFECTIF_COMMON_ALPHA },
  cec: { title: 'Apprenant - Effectif CEC', apiPath: '/api/effectif-cec', createFields: EFFECTIF_COMMON_CEC },
  cp: { title: 'Apprenant - Effectif CP', apiPath: '/api/effectif-cp', createFields: EFFECTIF_COMMON_CP },
  sie: { title: 'Apprenant - Effectif SIE', apiPath: '/api/effectif-sie', createFields: EFFECTIF_COMMON_SIE },
};

