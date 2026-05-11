import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-mode-alpha-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './mode-alpha-page.component.html',
  styleUrl: './mode-alpha-page.component.css',
})
export class ModeAlphaPageComponent {}
