import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { MenuFeatureCode } from '@core/config/menu-rbac.config';
import { ROUTE_MENU_FEATURE } from '@core/config/menu-rbac.config';
import { canViewAnyMenuFeature, canViewMenuFeature } from '@core/rbac/menu-rbac.util';
import { AuthService } from '@services/auth.service';

type RoutePermissionData = {
  menuPermission?: MenuFeatureCode | string;
  menuPermissions?: Array<MenuFeatureCode | string>;
  /** Défaut : au moins une permission (any). */
  menuPermissionMode?: 'any' | 'all';
};

/**
 * Bloque l’accès direct par URL si l’utilisateur n’a pas le droit menu (LIRE).
 * `route.data.menuPermission` ou déduction via {@link ROUTE_MENU_FEATURE}.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const data = route.data as RoutePermissionData;

  const explicit = data.menuPermission ?? data.menuPermissions;
  if (explicit != null) {
    const features = data.menuPermissions ?? [data.menuPermission!];
    const ok =
      data.menuPermissionMode === 'all'
        ? features.every((f) => canViewMenuFeature(auth, f as MenuFeatureCode))
        : canViewAnyMenuFeature(auth, features as MenuFeatureCode[]);
    if (!ok) {
      return router.createUrlTree(['/profil'], { queryParams: { accessDenied: '1' } });
    }
    return true;
  }

  const path = route.routeConfig?.path ?? '';
  const feature = ROUTE_MENU_FEATURE[path];
  if (feature && !canViewMenuFeature(auth, feature)) {
    return router.createUrlTree(['/profil'], { queryParams: { accessDenied: '1' } });
  }

  return true;
};
