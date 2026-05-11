import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-civilite-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './civilite-page.component.html',
  styleUrl: './civilite-page.component.css',
})
export class CivilitePageComponent {}
