import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
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
  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }
  if (auth.currentSession != null) {
    return true;
  }
  try {
    await firstValueFrom(auth.refreshMe());
    return true;
  } catch {
    auth.logout();
    return router.createUrlTree(['/login']);
  }
};
