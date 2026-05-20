import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-niveau-personnel-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './niveau-personnel-page.component.html',
  styleUrl: './niveau-personnel-page.component.css',
})
export class NiveauPersonnelPageComponent {}
