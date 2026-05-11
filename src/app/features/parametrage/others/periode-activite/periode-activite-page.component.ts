import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-periode-activite-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './periode-activite-page.component.html',
  styleUrl: './periode-activite-page.component.css',
})
export class PeriodeActivitePageComponent {}
