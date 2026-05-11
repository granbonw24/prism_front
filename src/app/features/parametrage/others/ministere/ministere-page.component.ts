import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-ministere-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './ministere-page.component.html',
  styleUrl: './ministere-page.component.css',
})
export class MinisterePageComponent {}
