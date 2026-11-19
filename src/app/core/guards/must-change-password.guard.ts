import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';

/** Bloque l’application tant que le mot de passe temporaire n’a pas été changé. */
export const blockIfMustChangePasswordGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.mustChangePassword()) {
    return router.createUrlTree(['/changer-mot-de-passe']);
  }
  return true;
};

/** Page de changement obligatoire : accessible uniquement si le flag est actif. */
export const mustChangePasswordPageGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.mustChangePassword()) {
    return router.createUrlTree(['/']);
  }
  return true;
};