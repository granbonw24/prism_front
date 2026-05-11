import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-statut-personnel-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './statut-personnel-page.component.html',
  styleUrl: './statut-personnel-page.component.css',
})
export class StatutPersonnelPageComponent {}
