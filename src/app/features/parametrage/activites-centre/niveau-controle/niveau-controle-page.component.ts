import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-niveau-controle-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './niveau-controle-page.component.html',
  styleUrl: './niveau-controle-page.component.css',
})
export class NiveauControlePageComponent {}
