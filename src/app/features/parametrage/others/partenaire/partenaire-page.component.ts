import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-partenaire-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './partenaire-page.component.html',
  styleUrl: './partenaire-page.component.css',
})
export class PartenairePageComponent {}
