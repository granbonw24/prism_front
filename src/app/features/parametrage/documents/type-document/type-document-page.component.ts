import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-type-document-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './type-document-page.component.html',
  styleUrl: './type-document-page.component.css',
})
export class TypeDocumentPageComponent {}
