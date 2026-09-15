import type { AuthService } from '@services/auth.service';
import { RBAC_BYPASS_ROLE_CODES } from '@core/config/menu-rbac.config';

/** Rôles métier « administration centrale AENF » (hors bypass technique). */
export const CENTRAL_ADMIN_ROLE_CODES = ['SUPERVISEUR_AENF', 'DIRECTEUR'] as const;

export function isCentralAdmin(auth: AuthService): boolean {
  const roles = auth.currentSession?.roles ?? [];
  if (roles.some((role) => RBAC_BYPASS_ROLE_CODES.has(role))) {
    return true;
  }
  return auth.hasAnyRole([...CENTRAL_ADMIN_ROLE_CODES]);
}
