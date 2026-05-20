import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-themeevaluation-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './themeevaluation-page.component.html',
  styleUrl: './themeevaluation-page.component.css',
})
export class ThemeevaluationPageComponent {}
