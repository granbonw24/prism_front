import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-nature-centre-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './nature-centre-page.component.html',
  styleUrl: './nature-centre-page.component.css',
})
export class NatureCentrePageComponent {}
