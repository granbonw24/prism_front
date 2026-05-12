import { Routes } from '@angular/router';
import { ActivitesCentreVisiteDetailComponent } from '@features/activites-centre/visite-detail/activites-centre-visite-detail.component';
import { ActivitesCentreVisiteComponent } from '@features/activites-centre/visite/activites-centre-visite.component';
import { VisitesListComponent } from '@features/visites/visites-list.component';

/** Menu ACTIVITES CENTRE : routes Visite + redirections depuis les anciens liens `/visites`. */
export const visitesFeatureRoutes: Routes = [
  {
    path: 'activites-centre/visite/detail/:id',
    component: ActivitesCentreVisiteDetailComponent,
    data: { title: 'ACTIVITES CENTRE — Visite — Détail' },
  },
  {
    path: 'activites-centre/visite/conseiller',
    component: ActivitesCentreVisiteComponent,
    data: { title: 'ACTIVITES CENTRE — Visite — Suivi du conseiller', mode: 'conseiller' },
  },
  {
    path: 'activites-centre/visite/superviseur',
    component: ActivitesCentreVisiteComponent,
    data: { title: 'ACTIVITES CENTRE — Visite — Suivi par le superviseur', mode: 'superviseur' },
  },
  {
    path: 'activites-centre/visite/iepp',
    component: ActivitesCentreVisiteComponent,
    data: { title: 'ACTIVITES CENTRE — Visite — Suivi par l’IEPP', mode: 'iepp' },
  },
  {
    path: 'activites-centre/visite/centrale',
    component: ActivitesCentreVisiteComponent,
    data: { title: 'ACTIVITES CENTRE — Visite — Suivi central AENF', mode: 'centrale' },
  },
  { path: 'visites/pointage', component: VisitesListComponent, data: { title: 'Visites — Point des visites' } },
  { path: 'visites/conseiller', redirectTo: 'activites-centre/visite/conseiller', pathMatch: 'full' },
  { path: 'visites/superviseur', redirectTo: 'activites-centre/visite/superviseur', pathMatch: 'full' },
  { path: 'visites/iepp', redirectTo: 'activites-centre/visite/iepp', pathMatch: 'full' },
  { path: 'visites/centrale', redirectTo: 'activites-centre/visite/centrale', pathMatch: 'full' },
];
