import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { REFERENTIEL_ROUTE_DATA } from '@core/config/referentiel-routes.data';
import { AuthService } from '@services/auth.service';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { Inject } from '@angular/core';
import { Observable } from 'rxjs';

type DashboardSummary = {
  centresTotal: number;
  alphaTotal: number;
  cecTotal: number;
  cpTotal: number;
  sieTotal: number;
  personnelTotal: number;
  usersTotal: number;
  rolesTotal: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  constructor(
    private readonly auth: AuthService,
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  readonly session$ = this.auth.session;
  readonly summary$: Observable<DashboardSummary> = this.http.get<DashboardSummary>(
    `${this.apiBaseUrl}/api/admin/dashboard`,
  );
  readonly referentielRoutes = REFERENTIEL_ROUTE_DATA;

  readonly adminLinks = [
    { title: 'Personnel', path: '/administration/personnel', icon: 'fas fa-users' },
    { title: 'Acteurs (rôles)', path: '/administration/acteurs', icon: 'fas fa-user-tag' },
    { title: 'Rôle permissions', path: '/administration/role-permissions', icon: 'fas fa-user-shield' },
    { title: 'Utilisateurs', path: '/administration/utilisateurs', icon: 'fas fa-user-cog' },
  ] as const;
}
