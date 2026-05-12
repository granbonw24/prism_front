import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-niveau-evaluation-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './niveau-evaluation-page.component.html',
  styleUrl: './niveau-evaluation-page.component.css',
})
export class NiveauEvaluationPageComponent {}
