import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-periode-evaluation-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './periode-evaluation-page.component.html',
  styleUrl: './periode-evaluation-page.component.css',
})
export class PeriodeEvaluationPageComponent {}
