import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-domaine-activite-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './domaine-activite-page.component.html',
  styleUrl: './domaine-activite-page.component.css',
})
export class DomaineActivitePageComponent {}
