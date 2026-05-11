import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-support-didactique-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './support-didactique-page.component.html',
  styleUrl: './support-didactique-page.component.css',
})
export class SupportDidactiquePageComponent {}
