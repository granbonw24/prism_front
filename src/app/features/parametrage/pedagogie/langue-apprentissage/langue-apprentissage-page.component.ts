import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-langue-apprentissage-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './langue-apprentissage-page.component.html',
  styleUrl: './langue-apprentissage-page.component.css',
})
export class LangueApprentissagePageComponent {}
