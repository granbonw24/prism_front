import type { AuthSession } from '@core/models/auth.models';

/** Utilisateur sans circonscription opérationnelle : statistiques sur tout le territoire. */
export function isNationalView(session: AuthSession | null | undefined): boolean {
  if (!session) {
    return false;
  }
  if (session.nationalView === true) {
    return true;
  }
  const nationalRoles = new Set([
    'ADMIN',
    'SUPER_ADMIN',
    'SUPER_ROOT',
    'SUPERVISEUR_AENF',
    'DIRECTEUR',
  ]);
  if (session.roles?.some((r) => nationalRoles.has(r))) {
    return true;
  }
  const roles = new Set((session.roles ?? []).map((r) => r.toUpperCase()));
  if (roles.has('COORDONNATEUR') || roles.has('CONSEILLER') || roles.has('IEPP')) {
    return session.idIep == null;
  }
  if (roles.has('SUPERVISEUR')) {
    return session.idDrena == null && session.idIep == null;
  }
  return session.idIep == null && session.idDrena == null;
}
