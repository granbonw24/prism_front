import { Routes } from '@angular/router';
import { ActeursComponent } from '@features/administration/acteurs/acteurs.component';
import { PersonnelComponent } from '@features/administration/personnel/personnel.component';
import { RolesActeursComponent } from '@features/administration/roles-acteurs/roles-acteurs.component';
import { UtilisateursComponent } from '@features/administration/utilisateurs/utilisateurs.component';

export const administrationFeatureRoutes: Routes = [
  { path: 'administration/acteurs', component: ActeursComponent },
  { path: 'administration/personnel', component: PersonnelComponent },
  { path: 'administration/role-permissions', component: RolesActeursComponent },
  { path: 'administration/utilisateurs', component: UtilisateursComponent },
];
