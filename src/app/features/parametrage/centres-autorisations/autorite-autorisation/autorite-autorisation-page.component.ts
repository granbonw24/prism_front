import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-autorite-autorisation-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './autorite-autorisation-page.component.html',
  styleUrl: './autorite-autorisation-page.component.css',
})
export class AutoriteAutorisationPageComponent {}
