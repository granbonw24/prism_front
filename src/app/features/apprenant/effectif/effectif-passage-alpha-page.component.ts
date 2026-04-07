import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';
import { EFFECTIF_PASSAGE_ALPHA_CREATE_FIELDS } from './effectif-satellite-forms.data';
import { effectifStatsByCentreType } from './effectif-list-stats-context';

@Component({
  selector: 'app-effectif-passage-alpha-page',
  standalone: true,
  imports: [ReferentielListPageComponent],
  template: `
    <app-referentiel-list-page
      [inputTitle]="title"
      [inputSubtitle]="subtitle"
      [inputApiPath]="apiPath"
      [inputCreateFields]="fields"
    />
  `,
})
export class EffectifPassageAlphaPageComponent {
  readonly statsContext = effectifStatsByCentreType('alpha');
  readonly title = 'Apprenant — Effectif passage (Alpha)';
  readonly subtitle =
    'Cet effectif concerne uniquement les centres Alpha. Il n’existe pas d’équivalent passage pour CP, CEC ou SIE côté API.';
  readonly apiPath = '/api/effectif-passage-alpha';
  readonly fields = EFFECTIF_PASSAGE_ALPHA_CREATE_FIELDS;
}
