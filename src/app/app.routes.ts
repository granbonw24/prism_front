import { Routes } from '@angular/router';
import { REFERENTIEL_ROUTE_DATA } from './core/config/referentiel-routes.data';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AppShellComponent } from './layout/app-shell.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { ReferentielListPageComponent } from './shared/referentiel-list-page/referentiel-list-page.component';
import { ActeursComponent } from './administration/acteurs/acteurs.component';
import { RolesActeursComponent } from './administration/roles-acteurs/roles-acteurs.component';
import { PersonnelComponent } from './administration/personnel/personnel.component';
import { UtilisateursComponent } from './administration/utilisateurs/utilisateurs.component';

const referentielRoutes: Routes = REFERENTIEL_ROUTE_DATA.map((r) => ({
  path: r.path,
  component: ReferentielListPageComponent,
  data: {
    title: r.title,
    apiPath: r.apiPath,
    createFields: r.createFields ?? [],
  },
}));

/** Routes affichées dans le `<router-outlet>` du `MainComponent` (zone de contenu). */
const mainChildRoutes: Routes = [
  { path: '', component: DashboardComponent },
  ...referentielRoutes,
  /** Acteur = gestion des rôles (CRUD rôles). */
  { path: 'administration/acteurs', component: ActeursComponent },
  { path: 'administration/personnel', component: PersonnelComponent },
  /** Rôle permission = droits (rôle ↔ fonctionnalité ↔ permission). */
  { path: 'administration/role-permissions', component: RolesActeursComponent },
  { path: 'administration/utilisateurs', component: UtilisateursComponent },
];

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginComponent,
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: MainComponent,
        children: mainChildRoutes,
      },
    ],
  },
];
