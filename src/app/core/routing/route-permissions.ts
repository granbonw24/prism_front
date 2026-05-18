import { Route } from '@angular/router';
import { permissionGuard } from '@core/guards/permission.guard';
import type { MenuFeatureCode } from '@core/config/menu-rbac.config';

/** Ajoute le garde RBAC menu (LIRE) sur une route feature. */
export function withMenuPermission(
  route: Route,
  menuPermission: MenuFeatureCode,
): Route {
  return {
    ...route,
    canActivate: [...(route.canActivate ?? []), permissionGuard],
    data: {
      ...(route.data ?? {}),
      menuPermission,
    },
  };
}
