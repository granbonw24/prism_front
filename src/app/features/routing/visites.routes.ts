import { Routes } from '@angular/router';
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { withMenuPermission } from '@core/routing/route-permissions';
import { ActivitesCentreVisiteDetailComponent } from '@features/activites-centre/visite-detail/activites-centre-visite-detail.component';
import { ActivitesCentreVisiteComponent } from '@features/activites-centre/visite/activites-centre-visite.component';
import { VisitesListComponent } from '@features/visites/visites-list.component';

/** Menu ACTIVITES CENTRE : routes Visite + redirections depuis les anciens liens `/visites`. */
export const visitesFeatureRoutes: Routes = [
  withMenuPermission(
    {
      path: 'activites-centre/visite/detail/:id',
      component: ActivitesCentreVisiteDetailComponent,
      data: { title: 'ACTIVITES CENTRE — Visite — Détail' },
    },
    MENU_FEATURES.SUIVI_CONSEILLER,
  ),
  withMenuPermission(
    {
      path: 'activites-centre/visite/conseiller',
      component: ActivitesCentreVisiteComponent,
      data: { title: 'ACTIVITES CENTRE — Visite — Suivi du conseiller', mode: 'conseiller' },
    },
    MENU_FEATURES.SUIVI_CONSEILLER,
  ),
  withMenuPermission(
    {
      path: 'activites-centre/visite/superviseur',
      component: ActivitesCentreVisiteComponent,
      data: { title: 'ACTIVITES CENTRE — Visite — Suivi par le superviseur', mode: 'superviseur' },
    },
    MENU_FEATURES.SUIVI_SUPERVISEUR,
  ),
  withMenuPermission(
    {
      path: 'activites-centre/visite/iepp',
      component: ActivitesCentreVisiteComponent,
      data: { title: 'ACTIVITES CENTRE — Visite — Suivi par l’IEPP', mode: 'iepp' },
    },
    MENU_FEATURES.SUIVI_IEPP,
  ),
  withMenuPermission(
    {
      path: 'activites-centre/visite/centrale',
      component: ActivitesCentreVisiteComponent,
      data: { title: 'ACTIVITES CENTRE — Visite — Suivi central AENF', mode: 'centrale' },
    },
    MENU_FEATURES.SUIVI_CENTRALE,
  ),
  withMenuPermission(
    { path: 'visites/pointage', component: VisitesListComponent, data: { title: 'Visites — Point des visites' } },
    MENU_FEATURES.POINTS_VISITES,
  ),
  { path: 'visites/conseiller', redirectTo: 'activites-centre/visite/conseiller', pathMatch: 'full' },
  { path: 'visites/superviseur', redirectTo: 'activites-centre/visite/superviseur', pathMatch: 'full' },
  { path: 'visites/iepp', redirectTo: 'activites-centre/visite/iepp', pathMatch: 'full' },
  { path: 'visites/centrale', redirectTo: 'activites-centre/visite/centrale', pathMatch: 'full' },
];
