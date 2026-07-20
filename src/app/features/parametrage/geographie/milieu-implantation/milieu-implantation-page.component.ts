import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-milieu-implantation-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './milieu-implantation-page.component.html',
  styleUrl: './milieu-implantation-page.component.css',
})
export class MilieuImplantationPageComponent {}
