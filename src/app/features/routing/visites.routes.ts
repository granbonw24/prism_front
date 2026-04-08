import { Routes } from '@angular/router';
import { VisitesListComponent } from '@features/visites/visites-list.component';

/** Menu Visites : mêmes données, titres selon le rôle métier (filtres spécifiques à ajouter plus tard). */
export const visitesFeatureRoutes: Routes = [
  { path: 'visites/pointage', component: VisitesListComponent, data: { title: 'Visites — Point des visites' } },
  { path: 'visites/conseiller', component: VisitesListComponent, data: { title: 'Visites — Suivi du conseiller' } },
  { path: 'visites/superviseur', component: VisitesListComponent, data: { title: 'Visites — Suivi par le superviseur' } },
  { path: 'visites/iepp', component: VisitesListComponent, data: { title: 'Visites — Suivi par l’IEPP' } },
];
