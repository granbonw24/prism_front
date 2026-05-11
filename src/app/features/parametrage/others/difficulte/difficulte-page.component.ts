import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-difficulte-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './difficulte-page.component.html',
  styleUrl: './difficulte-page.component.css',
})
export class DifficultePageComponent {}
