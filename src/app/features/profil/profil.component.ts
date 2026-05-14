import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthSession } from '@core/models/auth.models';
import { AuthPresentationService } from '@services/auth-presentation.service';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf],
  templateUrl: './profil.component.html',
})
export class ProfilComponent implements OnInit {
  readonly session$ = this.auth.session;

  /** Message après refus du permissionGuard (query params puis URL nettoyée). */
  accessDeniedMessage: string | null = null;

  /** Échec de chargement session (ex. jeton expiré ou API indisponible). */
  profileLoadError: string | null = null;

  constructor(
    private readonly auth: AuthService,
    readonly presentation: AuthPresentationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('accessDenied') === '1') {
      const raw = q.get('required') ?? '';
      this.accessDeniedMessage = this.formatAccessDeniedMessage(raw);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { accessDenied: null, required: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    this.auth.refreshMe().subscribe({
      error: () => {
        this.profileLoadError =
          'Impossible de charger votre profil. Vérifiez la connexion au serveur ou reconnectez-vous.';
      },
    });
  }

  dismissAccessDenied(): void {
    this.accessDeniedMessage = null;
  }

  private formatAccessDeniedMessage(raw: string): string {
    const base =
      "Vous n'avez pas les droits nécessaires pour accéder à la page ou à l'action demandée.";
    const suffix = ' Si votre rôle doit évoluer, contactez un administrateur de la plateforme.';
    const trimmed = raw.trim();
    if (!trimmed) {
      return `${base}${suffix}`;
    }
    if (trimmed.startsWith('ONE_OF:')) {
      const list = trimmed
        .slice('ONE_OF:'.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const detail =
        list.length > 0
          ? ` Il faut au moins l'une des permissions suivantes : ${list.join(', ')}.`
          : '';
      return `${base}${detail}${suffix}`;
    }
    return `${base} Permission attendue : ${trimmed}.${suffix}`;
  }

  roles(session: AuthSession): string {
    return session.roles.length > 0 ? session.roles.join(', ') : 'Aucun rôle renseigné';
  }

  permissionsCount(session: AuthSession): number {
    return session.permissions.length;
  }
}
