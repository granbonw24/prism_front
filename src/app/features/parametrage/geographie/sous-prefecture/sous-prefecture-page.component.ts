import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-sous-prefecture-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './sous-prefecture-page.component.html',
  styleUrl: './sous-prefecture-page.component.css',
})
export class SousPrefecturePageComponent {}
