import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom, timeout } from 'rxjs';
import { SessionExpiryService } from '@core/services/session-expiry.service';
import { AuthService } from '@services/auth.service';

/**
 * Authentification par jeton + chargement de la session (`/api/auth/me`) avant toute route enfant.
 * Sans cela, `permissionGuard` peut s'exécuter alors que `currentSession` est encore null (jeton présent
 * mais hydratation non terminée) et rediriger à tort vers `/profil`.
 *
 * `refreshMe()` est dédoublonné dans `AuthService` pour éviter des appels concurrents à `/me`.
 */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const sessionExpiry = inject(SessionExpiryService);
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.currentSession != null) {
    return true;
  }
  try {
    await firstValueFrom(auth.refreshMe().pipe(timeout(8_000)));
    return true;
  } catch (err: unknown) {
    if (!auth.isLoginInFlight) {
      const status =
        err instanceof HttpErrorResponse ? err.status : undefined;
      if (status != null && sessionExpiry.isSessionExpiredStatus(status)) {
        sessionExpiry.handleSessionExpired();
      } else {
        auth.clearLocalSession();
      }
    }
    return router.createUrlTree(['/login']);
  }
};
