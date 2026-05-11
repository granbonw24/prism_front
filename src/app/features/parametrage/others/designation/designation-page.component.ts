import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-designation-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './designation-page.component.html',
  styleUrl: './designation-page.component.css',
})
export class DesignationPageComponent {}
