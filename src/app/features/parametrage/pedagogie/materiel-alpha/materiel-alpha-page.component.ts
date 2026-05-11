import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-materiel-alpha-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './materiel-alpha-page.component.html',
  styleUrl: './materiel-alpha-page.component.css',
})
export class MaterielAlphaPageComponent {}
