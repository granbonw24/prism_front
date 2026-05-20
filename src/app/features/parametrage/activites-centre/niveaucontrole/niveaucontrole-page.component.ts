import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-niveaucontrole-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './niveaucontrole-page.component.html',
  styleUrl: './niveaucontrole-page.component.css',
})
export class NiveaucontrolePageComponent {}
