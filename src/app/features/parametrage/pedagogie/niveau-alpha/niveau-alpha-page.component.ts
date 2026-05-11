import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-niveau-alpha-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './niveau-alpha-page.component.html',
  styleUrl: './niveau-alpha-page.component.css',
})
export class NiveauAlphaPageComponent {}
