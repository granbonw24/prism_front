import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-niveau-cp-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './niveau-cp-page.component.html',
  styleUrl: './niveau-cp-page.component.css',
})
export class NiveauCpPageComponent {}
