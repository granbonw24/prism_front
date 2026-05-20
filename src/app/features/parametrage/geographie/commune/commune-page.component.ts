import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-commune-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './commune-page.component.html',
  styleUrl: './commune-page.component.css',
})
export class CommunePageComponent {}
