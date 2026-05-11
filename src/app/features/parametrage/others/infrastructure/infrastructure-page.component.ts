import { Component } from '@angular/core';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

@Component({
  standalone: true,
  selector: 'app-parametrage-infrastructure-page',
  imports: [ReferentielListPageComponent],
  templateUrl: './infrastructure-page.component.html',
  styleUrl: './infrastructure-page.component.css',
})
export class InfrastructurePageComponent {}
