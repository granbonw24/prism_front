import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';
import { COMPETENCE_CENTRE_CREATE_FIELDS } from './effectif-satellite-forms.data';

@Component({
  selector: 'app-effectif-competence-centre-page',
  standalone: true,
  imports: [ReferentielListPageComponent],
  template: `
    <app-referentiel-list-page
      [inputTitle]="title"
      [inputSubtitle]="subtitle"
      [inputApiPath]="apiPath"
      [inputPermissionFeature]="'SAISIE_DONNEES'"
      [inputWorkflowFeature]="'SAISIE_DONNEES'"
      [inputCreateFields]="fields"
      [inputEffectifDenseForm]="true"
    />
  `,
})
export class EffectifCompetenceCentrePageComponent {
  readonly title = 'Apprenant — Compétences par centre';
  readonly subtitle =
    'Réservé aux centres Alpha : l’API `/api/competence-centre` lie une compétence à un centre Alpha.';
  readonly apiPath = '/api/competence-centre';
  readonly fields = COMPETENCE_CENTRE_CREATE_FIELDS;
}
