import { Routes } from '@angular/router';
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { withMenuPermission } from '@core/routing/route-permissions';
import { PromoteursComponent } from '@features/promoteurs/promoteurs.component';

export const promoteursFeatureRoutes: Routes = [
  withMenuPermission({ path: 'promoteurs', component: PromoteursComponent }, MENU_FEATURES.PROMOTEUR),
];
