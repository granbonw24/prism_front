import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { BRAND_CONFIG } from '../core/config/brand.config';
import { REFERENTIEL_ROUTE_DATA } from '../core/config/referentiel-routes.data';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './menu.component.html',
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class MenuComponent {
  /** Liens référentiels : alignés sur `app.routes` et les `apiPath` du backend. */
  readonly referentielRoutes = REFERENTIEL_ROUTE_DATA;
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;
}
