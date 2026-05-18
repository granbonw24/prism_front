import { Routes } from '@angular/router';
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { withMenuPermission } from '@core/routing/route-permissions';
import { DashboardComponent } from '@features/dashboard/dashboard.component';

export const dashboardFeatureRoutes: Routes = [
  withMenuPermission({ path: '', component: DashboardComponent }, MENU_FEATURES.DASHBOARD),
];
