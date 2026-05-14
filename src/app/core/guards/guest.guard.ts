import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';

/**
 * Empêche d'afficher la page login si l'app a déjà une session chargée.
 * Seul le jeton (ex. expiré, pas encore effacé) ne suffit pas : sinon redirection vers `/` pendant
 * une tentative de connexion → annulation du POST `/login`.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated() || auth.currentSession == null) {
    return true;
  }
  return router.createUrlTree(['/']);
};
