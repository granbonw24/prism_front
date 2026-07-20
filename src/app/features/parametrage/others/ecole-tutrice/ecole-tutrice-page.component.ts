import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-ecole-tutrice-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './ecole-tutrice-page.component.html',
  styleUrl: './ecole-tutrice-page.component.css',
})
export class EcoleTutricePageComponent {}
