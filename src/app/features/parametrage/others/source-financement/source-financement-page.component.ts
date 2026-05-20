import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-source-financement-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './source-financement-page.component.html',
  styleUrl: './source-financement-page.component.css',
})
export class SourceFinancementPageComponent {}
