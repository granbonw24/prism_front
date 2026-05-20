import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-departement-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './departement-page.component.html',
  styleUrl: './departement-page.component.css',
})
export class DepartementPageComponent {}
