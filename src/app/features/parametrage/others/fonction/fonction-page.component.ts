import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-fonction-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './fonction-page.component.html',
  styleUrl: './fonction-page.component.css',
})
export class FonctionPageComponent {}
