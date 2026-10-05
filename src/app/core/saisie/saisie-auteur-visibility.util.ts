/** Rôles qui voient l’auteur conseiller des saisies. */
export const SAISIE_CONSEILLER_AUTEUR_ROLES = [
  'COORDONNATEUR',
  'IEPP',
  'SUPERVISEUR',
  'SUPERVISEUR_AENF',
  'DIRECTEUR',
  'ADMIN',
  'SUPER_ADMIN',
  'SUPER_ROOT',
] as const;

/** Rôles qui voient le coordonnateur validateur ({@code valideCoordNom}). */
export const SAISIE_COORDONNATEUR_AUTEUR_ROLES = [
  'SUPERVISEUR',
  'SUPERVISEUR_AENF',
  'DIRECTEUR',
  'ADMIN',
  'SUPER_ADMIN',
  'SUPER_ROOT',
] as const;

/** Rôles qui voient le superviseur validateur ({@code valideSupNom}). */
export const SAISIE_SUP_VALIDATEUR_ROLES = [
  'DIRECTEUR',
  'SUPERVISEUR_AENF',
  'ADMIN',
  'SUPER_ADMIN',
  'SUPER_ROOT',
] as const;

/** Rôles qui voient le validateur central ({@code valideCentralNom}). */
export const SAISIE_CENTRAL_VALIDATEUR_ROLES = [
  'DIRECTEUR',
  'ADMIN',
  'SUPER_ADMIN',
  'SUPER_ROOT',
] as const;

export function canSeeConseillerAuteur(roles: readonly string[] | null | undefined): boolean {
  return hasAny(roles, SAISIE_CONSEILLER_AUTEUR_ROLES);
}

export function canSeeCoordonnateurAuteur(roles: readonly string[] | null | undefined): boolean {
  return hasAny(roles, SAISIE_COORDONNATEUR_AUTEUR_ROLES);
}

export function canSeeSuperviseurValidateur(roles: readonly string[] | null | undefined): boolean {
  return hasAny(roles, SAISIE_SUP_VALIDATEUR_ROLES);
}

export function canSeeCentralValidateur(roles: readonly string[] | null | undefined): boolean {
  return hasAny(roles, SAISIE_CENTRAL_VALIDATEUR_ROLES);
}

export function auteurColumnCount(roles: readonly string[] | null | undefined): number {
  return (
    (canSeeConseillerAuteur(roles) ? 1 : 0)
    + (canSeeCoordonnateurAuteur(roles) ? 1 : 0)
    + (canSeeSuperviseurValidateur(roles) ? 1 : 0)
    + (canSeeCentralValidateur(roles) ? 1 : 0)
  );
}

function hasAny(roles: readonly string[] | null | undefined, wanted: readonly string[]): boolean {
  if (!roles?.length) {
    return false;
  }
  return wanted.some((role) => roles.includes(role));
}
