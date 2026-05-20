import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-drena-departement-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './drena-departement-page.component.html',
  styleUrl: './drena-departement-page.component.css',
})
export class DrenaDepartementPageComponent {}
