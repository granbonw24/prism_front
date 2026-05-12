import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-theme-evaluation-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './theme-evaluation-page.component.html',
  styleUrl: './theme-evaluation-page.component.css',
})
export class ThemeEvaluationPageComponent {}
