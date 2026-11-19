import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@services/auth.service';
import { SessionStore } from '@services/session-store.service';
import { TokenStorageService } from '@services/token-storage.service';

const SESSION_EXPIRED_MESSAGE =
  'Votre session a expiré ou votre jeton n’est plus valide. Vous allez être redirigé vers la page de connexion.';

/**
 * Déconnexion centralisée après jeton invalide / expiré (401 ou 403 sans droits réels).
 */
@Injectable({ providedIn: 'root' })
export class SessionExpiryService {
  private readonly tokens = inject(TokenStorageService);
  private readonly sessionStore = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);

  private flowInProgress = false;

  get isHandling(): boolean {
    return this.flowInProgress;
  }

  /** Nettoie la session et renvoie vers /login (avec notification si demandée). */
  handleSessionExpired(options?: { notify?: boolean; navigate?: boolean }): void {
    const notify = options?.notify !== false;
    const navigate = options?.navigate !== false;

    if (this.auth.isLoginInFlight) {
      return;
    }
    if (this.flowInProgress) {
      return;
    }
    this.flowInProgress = true;

    if (notify) {
      this.notification.show(SESSION_EXPIRED_MESSAGE, 'warning', 4000);
    }

    this.tokens.clear();
    this.sessionStore.clear();

    if (navigate) {
      setTimeout(() => {
        void this.router.navigateByUrl('/login', { replaceUrl: true });
        this.flowInProgress = false;
      }, 300);
    } else {
      this.flowInProgress = false;
    }
  }

  /** Réponse HTTP indiquant une session absente ou un jeton refusé (401 uniquement). */
  isSessionExpiredStatus(status: number): boolean {
    return status === 401;
  }
}