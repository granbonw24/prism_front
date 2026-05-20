import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-drena-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './drena-page.component.html',
  styleUrl: './drena-page.component.css',
})
export class DrenaPageComponent {}
