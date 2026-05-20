import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-region-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './region-page.component.html',
  styleUrl: './region-page.component.css',
})
export class RegionPageComponent {}
