import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BRAND_CONFIG } from '@core/config/brand.config';
import { groupReferentielsForMenu } from '@core/config/referentiel-menu.groups';
import { REFERENTIEL_ROUTE_DATA } from '@core/config/referentiel-routes.data';
import { AuthService } from '@services/auth.service';

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
  private readonly activitesCentrePermissions = [
    'ACTIVITES_CENTRE_PARTENARIAT:LIRE',
    'ACTIVITES_CENTRE_PERFORMANCE:LIRE',
    'ACTIVITES_CENTRE_CONTROLE:LIRE',
    'ACTIVITES_CENTRE_EVALUATION:LIRE',
    'ACTIVITES_CENTRE_INFOS:LIRE',
    'POINTS_VISITES:LIRE',
    'POINTS_VISITES:CREER',
    'SUIVI_CONSEILLER:LIRE',
    'VALIDATION_VISITES_CONSEILLER:VALIDER',
    'SUIVI_SUPERVISEUR:LIRE',
    'SUIVI_IEPP:LIRE',
    'SUIVI_CENTRALE:LIRE',
  ];

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  canViewActivitesCentre(): boolean {
    return this.auth.hasAnyPermission(this.activitesCentrePermissions);
  }

  canViewSuiviConseiller(): boolean {
    return (
      this.auth.hasPermission('SUIVI_CONSEILLER:LIRE') ||
      this.auth.hasPermission('POINTS_VISITES:LIRE') ||
      this.auth.hasPermission('POINTS_VISITES:CREER') ||
      this.auth.hasPermission('VALIDATION_VISITES_CONSEILLER:VALIDER')
    );
  }

  canViewSuiviSuperviseur(): boolean {
    return this.auth.hasPermission('SUIVI_SUPERVISEUR:LIRE');
  }

  canViewSuiviIepp(): boolean {
    return this.auth.hasPermission('SUIVI_IEPP:LIRE');
  }

  canViewSuiviCentrale(): boolean {
    return this.auth.hasPermission('SUIVI_CENTRALE:LIRE');
  }

  canViewActivitesCentreVisite(): boolean {
    return (
      this.canViewSuiviConseiller() ||
      this.canViewSuiviSuperviseur() ||
      this.canViewSuiviIepp() ||
      this.canViewSuiviCentrale()
    );
  }

  canViewActivitesCentrePartenariat(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_PARTENARIAT:LIRE');
  }

  canViewActivitesCentrePerformance(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_PERFORMANCE:LIRE');
  }

  canViewActivitesCentreControle(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_CONTROLE:LIRE');
  }

  canViewActivitesCentreEvaluation(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_EVALUATION:LIRE');
  }

  canViewActivitesCentreInfos(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_INFOS:LIRE');
  }

  /** Ouvre le bloc ACTIVITES CENTRE lorsque l’URL courante est une route d’activité centre. */
  activitesCentreSectionOpen(): boolean {
    return this.router.url.startsWith('/activites-centre') || this.router.url.startsWith('/visites');
  }

  /** Ouvre le sous-menu Visite dans ACTIVITES CENTRE. */
  activitesCentreVisiteSectionOpen(): boolean {
    return this.router.url.startsWith('/activites-centre/visite') || this.router.url.startsWith('/visites');
  }

  /** Liens référentiels : alignés sur `app.routes` et les `apiPath` du backend. */
  readonly referentielRoutes = REFERENTIEL_ROUTE_DATA;
  readonly referentielGroups = groupReferentielsForMenu(REFERENTIEL_ROUTE_DATA);
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;

  groupCollapseId(prefix: string, title: string): string {
    const slug = title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${prefix}-${slug || 'g'}`;
  }
}
