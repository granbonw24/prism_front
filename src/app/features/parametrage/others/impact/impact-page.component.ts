import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-impact-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './impact-page.component.html',
  styleUrl: './impact-page.component.css',
})
export class ImpactPageComponent {}
