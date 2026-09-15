import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isCentralAdmin } from '@core/auth/central-admin.util';
import { AuthService } from '@services/auth.service';

/** Bloque l’accès aux écrans réservés à l’administration centrale. */
export const centralAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (isCentralAdmin(auth)) {
    return true;
  }
  return router.createUrlTree(['/']);
};
