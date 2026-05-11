import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-periodicite-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './periodicite-page.component.html',
  styleUrl: './periodicite-page.component.css',
})
export class PeriodicitePageComponent {}
