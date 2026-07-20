import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, Inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MENU_FEATURES, type MenuFeatureCode } from '@core/config/menu-rbac.config';
import { canViewMenuFeature } from '@core/rbac/menu-rbac.util';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AuthSession } from '@core/models/auth.models';
import { AuthPresentationService } from '@services/auth-presentation.service';
import { AuthService } from '@services/auth.service';
import { Observable, shareReplay } from 'rxjs';

export type DashboardSummary = {
  scopeMode: string;
  scopeLabel: string;
  nationalView: boolean;
  centresTotal: number;
  alphaTotal: number;
  cecTotal: number;
  cpTotal: number;
  sieTotal: number;
  personnelTotal: number;
  visitesTotal: number;
  controlesTotal: number;
  evaluationsTotal: number;
  usersTotal: number | null;
  rolesTotal: number | null;
};

type QuickLink = {
  title: string;
  path: string;
  icon: string;
  feature?: MenuFeatureCode;
  action?: string;
  /** @deprecated prefer feature/action — kept for multi-permission OR checks */
  permissions?: string[];
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  constructor(
    private readonly auth: AuthService,
    private readonly http: HttpClient,
    readonly presentation: AuthPresentationService,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  readonly session$ = this.auth.session;
  readonly summary$: Observable<DashboardSummary> = this.http
    .get<DashboardSummary>(`${this.apiBaseUrl}/api/admin/dashboard`)
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  private readonly allQuickLinks: QuickLink[] = [
    {
      title: 'Centres Alpha',
      path: '/centres/alpha',
      icon: 'fas fa-school',
      feature: MENU_FEATURES.CENTRES_ALPHA,
      action: 'CREER',
    },
    {
      title: 'Centres CEC',
      path: '/centres/cec',
      icon: 'fas fa-building',
      feature: MENU_FEATURES.CENTRES_CEC,
      action: 'CREER',
    },
    {
      title: 'Centres CP',
      path: '/centres/cp',
      icon: 'fas fa-building',
      feature: MENU_FEATURES.CENTRES_CP,
      action: 'CREER',
    },
    {
      title: 'Centres SIE',
      path: '/centres/sie',
      icon: 'fas fa-building',
      feature: MENU_FEATURES.CENTRES_SIE,
      action: 'CREER',
    },
    {
      title: 'Personnel',
      path: '/personnel',
      icon: 'fas fa-users',
      feature: MENU_FEATURES.PERSONNEL,
      action: 'LIRE',
    },
    {
      title: 'Visites',
      path: '/activites-centre/visite/conseiller',
      icon: 'fas fa-clipboard-list',
      permissions: ['POINTS_VISITES:LIRE', 'SUIVI_CONSEILLER:LIRE'],
    },
    {
      title: 'Contrôles',
      path: '/activites-centre/controle',
      icon: 'fas fa-tasks',
      feature: MENU_FEATURES.ACTIVITES_CENTRE_CONTROLE,
      action: 'LIRE',
    },
    {
      title: 'Évaluations',
      path: '/activites-centre/evaluation-periodique',
      icon: 'fas fa-chart-line',
      feature: MENU_FEATURES.ACTIVITES_CENTRE_EVALUATION,
      action: 'LIRE',
    },
    {
      title: 'Utilisateurs',
      path: '/administration/utilisateurs',
      icon: 'fas fa-user-cog',
      feature: MENU_FEATURES.ADMIN_UTILISATEURS,
      action: 'LIRE',
    },
    {
      title: 'Acteurs',
      path: '/administration/acteurs',
      icon: 'fas fa-user-tag',
      feature: MENU_FEATURES.ADMIN_ACTEURS,
      action: 'LIRE',
    },
  ];

  ngOnInit(): void {
    this.auth.refreshMe().subscribe({ error: () => undefined });
  }

  quickLinks(session: AuthSession | null): QuickLink[] {
    if (!session) {
      return [];
    }
    return this.allQuickLinks.filter((link) => {
      if (link.feature) {
        return canViewMenuFeature(this.auth, link.feature, link.action ?? 'LIRE');
      }
      if (link.permissions?.length) {
        return this.auth.hasAnyPermission(link.permissions);
      }
      return true;
    });
  }

  scopeDetail(session: AuthSession | null): string {
    if (!session) {
      return '';
    }
    const scopes = this.presentation.allScopes(session);
    if (scopes.length === 0) {
      return '';
    }
    return scopes
      .map((s) => `${s.label} : ${this.presentation.referenceLabel(s.ref, s.id)}`)
      .join(' · ');
  }
}
