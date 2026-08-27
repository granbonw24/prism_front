import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';
import { EFFECTIF_PROMU_CP_CREATE_FIELDS } from './effectif-promu-cp-forms.data';

@Component({
  selector: 'app-effectif-centres-promus-cp-page',
  standalone: true,
  imports: [CommonModule, ReferentielListPageComponent],
  template: `
    <app-referentiel-list-page
      inputTitle="Apprenant — Les centres promus (CP)"
      inputSubtitle="Enregistrement des centres promus et effectifs correspondants pour les classes passerelles. Les centres promus n’apparaissent plus dans la liste CP standard."
      inputApiPath="/api/effectif-promu-cp"
      [inputPermissionFeature]="'SAISIE_DONNEES'"
      [inputWorkflowFeature]="'SAISIE_DONNEES'"
      [inputCreateFields]="createFields"
      [inputEffectifDenseForm]="true"
      [inputEffectifBreakdownReadOnlyOnCreate]="true"
      [inputListColumnKeys]="listColumnKeys"
      inputContextDashboardModule="APPRENANT"
      inputContextDashboardSubModule="effectif-promu-cp"
      [inputContextDashboardAlwaysVisible]="true"
    ></app-referentiel-list-page>
  `,
})
export class EffectifCentresPromusCpPageComponent {
  readonly createFields = EFFECTIF_PROMU_CP_CREATE_FIELDS;
  readonly listColumnKeys = [
    'periodeActivite',
    'anneeScolaire',
    'centre',
    'niveauCp',
    'effectifPromuCpNiveauH',
    'effectifPromuCpNiveauF',
  ];
}
