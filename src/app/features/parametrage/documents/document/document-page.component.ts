import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-document-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './document-page.component.html',
  styleUrl: './document-page.component.css',
})
export class DocumentPageComponent {}
