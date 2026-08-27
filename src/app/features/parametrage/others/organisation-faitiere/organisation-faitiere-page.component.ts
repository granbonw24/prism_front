import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-organisation-faitiere-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './organisation-faitiere-page.component.html',
  styleUrl: './organisation-faitiere-page.component.css',
})
export class OrganisationFaitierePageComponent {}
