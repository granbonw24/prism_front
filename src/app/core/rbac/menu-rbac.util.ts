import {
  MENU_FEATURES,
  RBAC_BYPASS_ROLE_CODES,
  type MenuFeatureCode,
} from '@core/config/menu-rbac.config';
import type { AuthSession } from '@core/models/auth.models';
import type { AuthService } from '@services/auth.service';

export function bypassesMenuRbac(session: AuthSession | null | undefined): boolean {
  if (!session?.roles?.length) {
    return false;
  }
  return session.roles.some((r) => RBAC_BYPASS_ROLE_CODES.has(r));
}

export function menuPermissionKey(feature: MenuFeatureCode, action = 'LIRE'): string {
  return `${feature}:${action}`;
}

export function canViewMenuFeature(
  auth: Pick<AuthService, 'currentSession' | 'hasPermission'>,
  feature: MenuFeatureCode,
  action = 'LIRE',
): boolean {
  const session = auth.currentSession;
  if (bypassesMenuRbac(session)) {
    return true;
  }
  return auth.hasPermission(menuPermissionKey(feature, action));
}

export function canViewAnyMenuFeature(
  auth: Pick<AuthService, 'currentSession' | 'hasPermission' | 'hasAnyPermission'>,
  features: MenuFeatureCode[],
  action = 'LIRE',
): boolean {
  const session = auth.currentSession;
  if (bypassesMenuRbac(session)) {
    return true;
  }
  if (features.length === 0) {
    return false;
  }
  return auth.hasAnyPermission(features.map((f) => menuPermissionKey(f, action)));
}

export const CENTRES_MENU_FEATURES = [
  MENU_FEATURES.CENTRES_ALPHA,
  MENU_FEATURES.CENTRES_CEC,
  MENU_FEATURES.CENTRES_CP,
  MENU_FEATURES.CENTRES_SIE,
] as const;

export const APPRENANT_MENU_FEATURES = [
  MENU_FEATURES.APPRENANT_EFFECTIF,
  MENU_FEATURES.APPRENANT_ABANDON,
  MENU_FEATURES.APPRENANT_PASSAGE,
  MENU_FEATURES.APPRENANT_HANDICAP,
  MENU_FEATURES.APPRENANT_COMPETENCES,
  MENU_FEATURES.APPRENANT_PROMUS,
  MENU_FEATURES.APPRENANT_REVERSE_FORMEL_SIE,
  MENU_FEATURES.APPRENANT_ADMIS_CEPE,
  MENU_FEATURES.APPRENANT_INTEGRES_FORMEL_CP,
  MENU_FEATURES.APPRENANT_ADMIS_TEST_INTEGRATION_CP,
] as const;

export const ADMIN_MENU_FEATURES = [
  MENU_FEATURES.ADMIN_UTILISATEURS,
  MENU_FEATURES.ADMIN_ACTEURS,
  MENU_FEATURES.ADMIN_ROLE_PERMISSIONS,
] as const;
