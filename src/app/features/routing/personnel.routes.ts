import { Routes } from '@angular/router';
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { withMenuPermission } from '@core/routing/route-permissions';
import { PersonnelComponent } from '@features/administration/personnel/personnel.component';

export const personnelFeatureRoutes: Routes = [
  withMenuPermission({ path: 'personnel', component: PersonnelComponent }, MENU_FEATURES.PERSONNEL),
  { path: 'administration/personnel', redirectTo: 'personnel', pathMatch: 'full' },
];
