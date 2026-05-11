import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-nature-document-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './nature-document-page.component.html',
  styleUrl: './nature-document-page.component.css',
})
export class NatureDocumentPageComponent {}
