import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-discipline-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './discipline-page.component.html',
  styleUrl: './discipline-page.component.css',
})
export class DisciplinePageComponent {}
