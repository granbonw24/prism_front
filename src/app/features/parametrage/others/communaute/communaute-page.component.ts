import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-communaute-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './communaute-page.component.html',
  styleUrl: './communaute-page.component.css',
})
export class CommunautePageComponent {}
