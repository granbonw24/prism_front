import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-iep-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './iep-page.component.html',
  styleUrl: './iep-page.component.css',
})
export class IepPageComponent {}
