import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-diplome-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './diplome-page.component.html',
  styleUrl: './diplome-page.component.css',
})
export class DiplomePageComponent {}
