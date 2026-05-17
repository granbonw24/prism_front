import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { BRAND_CONFIG } from '@core/config/brand.config';
import type { ReferentielMenuGroup } from '@core/config/referentiel-menu.groups';
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
  /** Sections ouvertes manuellement (en plus de l’ouverture automatique par URL). */
  private readonly menuExpanded = new Set<string>();
  /** Sections repliées explicitement par l’utilisateur (même si l’URL correspond). */
  private readonly menuCollapsed = new Set<string>();

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
  ) {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.menuCollapsed.clear());
  }

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

  /** Ouverture sidebar sans dépendre du JS Bootstrap (Angular + classes `.show`). */
  isMenuSectionOpen(sectionId: string, routePrefixes: string[]): boolean {
    if (this.menuCollapsed.has(sectionId)) {
      return false;
    }
    const url = this.router.url.split('?')[0];
    if (routePrefixes.some((p) => url === p || url.startsWith(p + '/'))) {
      return true;
    }
    return this.menuExpanded.has(sectionId);
  }

  toggleMenuSection(sectionId: string, event: Event, routePrefixes: string[] = []): void {
    event.preventDefault();
    const url = this.router.url.split('?')[0];
    const activeOnRoute = routePrefixes.some((p) => url === p || url.startsWith(p + '/'));
    const open = this.isMenuSectionOpen(sectionId, routePrefixes);
    if (open) {
      this.menuCollapsed.add(sectionId);
      this.menuExpanded.delete(sectionId);
      return;
    }
    this.menuCollapsed.delete(sectionId);
    if (!activeOnRoute) {
      this.menuExpanded.add(sectionId);
    }
  }

  isRefGroupOpen(group: ReferentielMenuGroup): boolean {
    const id = this.groupCollapseId('ref', group.title);
    const prefixes = group.items.map((r) => '/' + r.path);
    return this.isMenuSectionOpen(id, prefixes);
  }

  private parametragePrefixes(): string[] {
    return ['/anneescolaire', ...this.referentielRoutes.map((r) => '/' + r.path)];
  }

  isParametrageOpen(): boolean {
    return this.isMenuSectionOpen('parametrage', this.parametragePrefixes());
  }

  toggleParametrage(event: Event): void {
    this.toggleMenuSection('parametrage', event);
  }

  /** Ouvre le bloc ACTIVITES CENTRE lorsque l’URL courante est une route d’activité centre. */
  activitesCentreSectionOpen(): boolean {
    return this.isMenuSectionOpen('activites-centre', ['/activites-centre', '/visites']);
  }

  /** Ouvre le sous-menu Visite dans ACTIVITES CENTRE. */
  activitesCentreVisiteSectionOpen(): boolean {
    return this.isMenuSectionOpen('activites-visite', ['/activites-centre/visite', '/visites']);
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
