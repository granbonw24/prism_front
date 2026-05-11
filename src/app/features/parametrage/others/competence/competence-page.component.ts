import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-competence-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './competence-page.component.html',
  styleUrl: './competence-page.component.css',
})
export class CompetencePageComponent {}
