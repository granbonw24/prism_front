import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class MenuComponent implements OnInit, OnDestroy {
  private documentClickHandler?: (event: MouseEvent) => void;
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
      .subscribe(() => {
        this.menuCollapsed.clear();
        this.closeMobileSidebar();
      });
  }

  ngOnInit(): void {
    this.unbindSbAdminMobileToggle();
    window.addEventListener('load', () => this.unbindSbAdminMobileToggle());
    setTimeout(() => this.unbindSbAdminMobileToggle(), 0);
    this.syncMobileSidebarClosed();

    this.documentClickHandler = (event: MouseEvent) => {
      if (!this.isMobileViewport() || !document.body.classList.contains('mena-mobile-nav-open')) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      if (target.closest('.sidebar.mena-sidebar') || target.closest('#sidebarToggleTop')) {
        return;
      }
      this.closeMobileSidebar();
    };
    document.addEventListener('click', this.documentClickHandler);
  }

  /** Désactive le toggle jQuery (conflit avec notre tiroir `mena-mobile-nav-open`). */
  private unbindSbAdminMobileToggle(): void {
    const jq = (window as unknown as { jQuery?: (sel: string) => { off: (ev: string) => void } }).jQuery;
    jq?.('#sidebarToggleTop')?.off('click');
  }

  private syncMobileSidebarClosed(): void {
    if (!this.isMobileViewport()) {
      document.body.classList.remove('mena-mobile-nav-open');
      return;
    }
    document.body.classList.remove('mena-mobile-nav-open');
    document.body.classList.add('sidebar-toggled');
    document.querySelector('.sidebar.mena-sidebar')?.classList.add('toggled');
  }

  ngOnDestroy(): void {
    if (this.documentClickHandler) {
      document.removeEventListener('click', this.documentClickHandler);
    }
  }

  private isMobileViewport(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(max-width: 991.98px)').matches;
  }

  /** Ferme le tiroir latéral après navigation (SB Admin : body.sidebar-toggled). */
  closeMobileSidebar(): void {
    if (!this.isMobileViewport()) {
      return;
    }
    document.body.classList.remove('mena-mobile-nav-open');
    document.body.classList.add('sidebar-toggled');
    document.querySelector('.sidebar.mena-sidebar')?.classList.add('toggled');
  }

  private allMenuSections(): ReadonlyArray<{ id: string; prefixes: string[] }> {
    return [
      { id: 'centres', prefixes: ['/centres'] },
      { id: 'personnel', prefixes: ['/personnel'] },
      { id: 'apprenant', prefixes: ['/apprenant'] },
      { id: 'activites-centre', prefixes: ['/activites-centre', '/visites'] },
      { id: 'activites-visite', prefixes: ['/activites-centre/visite', '/visites'] },
      { id: 'administration', prefixes: ['/administration'] },
      { id: 'admin-gestion', prefixes: ['/administration/utilisateurs'] },
      { id: 'admin-securite', prefixes: ['/administration/acteurs', '/administration/role-permissions'] },
      { id: 'parametrage', prefixes: this.parametragePrefixes() },
      ...this.referentielGroups.map((g) => ({
        id: this.groupCollapseId('ref', g.title),
        prefixes: this.refGroupPrefixes(g),
      })),
    ];
  }

  private readonly topLevelMenuIds = [
    'centres',
    'apprenant',
    'activites-centre',
    'administration',
    'parametrage',
  ] as const;

  /** Garde les ancêtres ouverts (ex. Paramétrage pour Géographie). */
  private ensureAncestorSectionsOpen(sectionId: string): void {
    if (sectionId.startsWith('ref-')) {
      this.menuCollapsed.delete('parametrage');
      this.menuExpanded.add('parametrage');
    }
    if (sectionId === 'admin-gestion' || sectionId === 'admin-securite') {
      this.menuCollapsed.delete('administration');
      this.menuExpanded.add('administration');
    }
    if (sectionId === 'activites-visite') {
      this.menuCollapsed.delete('activites-centre');
      this.menuExpanded.add('activites-centre');
    }
  }

  /** Replie uniquement les frères du même niveau (ne ferme pas le parent). */
  private applyMobileAccordion(openingId: string): void {
    if (!this.isMobileViewport()) {
      return;
    }
    const url = this.router.url.split('?')[0];

    if ((this.topLevelMenuIds as readonly string[]).includes(openingId)) {
      for (const id of this.topLevelMenuIds) {
        if (id === openingId) {
          this.menuCollapsed.delete(id);
          continue;
        }
        const prefixes = this.prefixesForSection(id);
        if (prefixes.some((p) => url === p || url.startsWith(p + '/'))) {
          continue;
        }
        this.menuExpanded.delete(id);
        this.menuCollapsed.add(id);
      }
      return;
    }

    if (openingId.startsWith('ref-')) {
      for (const { id } of this.allMenuSections()) {
        if (!id.startsWith('ref-') || id === openingId) {
          continue;
        }
        this.menuExpanded.delete(id);
        this.menuCollapsed.add(id);
      }
      return;
    }

    if (openingId === 'admin-gestion' || openingId === 'admin-securite') {
      const sibling = openingId === 'admin-gestion' ? 'admin-securite' : 'admin-gestion';
      this.menuExpanded.delete(sibling);
      this.menuCollapsed.add(sibling);
    }
  }

  private prefixesForSection(sectionId: string): string[] {
    return this.allMenuSections().find((s) => s.id === sectionId)?.prefixes ?? [];
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
    event.stopPropagation();
    const url = this.router.url.split('?')[0];
    const activeOnRoute = routePrefixes.some((p) => url === p || url.startsWith(p + '/'));
    const open = this.isMenuSectionOpen(sectionId, routePrefixes);
    if (open) {
      this.menuCollapsed.add(sectionId);
      this.menuExpanded.delete(sectionId);
      return;
    }
    this.ensureAncestorSectionsOpen(sectionId);
    this.applyMobileAccordion(sectionId);
    this.menuCollapsed.delete(sectionId);
    if (!activeOnRoute) {
      this.menuExpanded.add(sectionId);
    }
  }

  isRefGroupOpen(group: ReferentielMenuGroup): boolean {
    const id = this.groupCollapseId('ref', group.title);
    return this.isMenuSectionOpen(id, this.refGroupPrefixes(group));
  }

  refGroupPrefixes(group: ReferentielMenuGroup): string[] {
    return group.items.map((r) => '/' + r.path);
  }

  private parametragePrefixes(): string[] {
    return ['/anneescolaire', ...this.referentielRoutes.map((r) => '/' + r.path)];
  }

  isParametrageOpen(): boolean {
    return this.isMenuSectionOpen('parametrage', this.parametragePrefixes());
  }

  toggleParametrage(event: Event): void {
    this.toggleMenuSection('parametrage', event, this.parametragePrefixes());
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
