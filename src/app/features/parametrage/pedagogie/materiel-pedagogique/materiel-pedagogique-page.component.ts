import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-materiel-pedagogique-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './materiel-pedagogique-page.component.html',
  styleUrl: './materiel-pedagogique-page.component.css',
})
export class MaterielPedagogiquePageComponent {}
