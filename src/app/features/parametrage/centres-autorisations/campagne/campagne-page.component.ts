import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-campagne-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './campagne-page.component.html',
  styleUrl: './campagne-page.component.css',
})
export class CampagnePageComponent {}
