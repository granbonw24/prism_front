import { Routes } from '@angular/router';
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { withMenuPermission } from '@core/routing/route-permissions';
import { ActeursComponent } from '@features/administration/acteurs/acteurs.component';
import { RolesActeursComponent } from '@features/administration/roles-acteurs/roles-acteurs.component';
import { UtilisateursComponent } from '@features/administration/utilisateurs/utilisateurs.component';

export const administrationFeatureRoutes: Routes = [
  withMenuPermission(
    { path: 'administration/acteurs', component: ActeursComponent },
    MENU_FEATURES.ADMIN_ACTEURS,
  ),
  withMenuPermission(
    { path: 'administration/role-permissions', component: RolesActeursComponent },
    MENU_FEATURES.ADMIN_ROLE_PERMISSIONS,
  ),
  withMenuPermission(
    { path: 'administration/utilisateurs', component: UtilisateursComponent },
    MENU_FEATURES.ADMIN_UTILISATEURS,
  ),
];
