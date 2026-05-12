import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-manuel-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './manuel-page.component.html',
  styleUrl: './manuel-page.component.css',
})
export class ManuelPageComponent {}
