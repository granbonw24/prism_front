import { Routes } from '@angular/router';

export const partenairePlaceholderRoutes: Routes = [
  { path: 'partenaire/partenariat', redirectTo: 'activites-centre/partenariat', pathMatch: 'full' },
];

/** Sections menu sans écran métier : à remplacer par de vraies features quand le backend est prêt. */
export const sectionPlaceholderRoutes: Routes = [
  { path: 'performance', redirectTo: 'activites-centre/performance', pathMatch: 'full' },
  { path: 'control', redirectTo: 'activites-centre/controle', pathMatch: 'full' },
  { path: 'evaluation-periodique', redirectTo: 'activites-centre/evaluation-periodique', pathMatch: 'full' },
];
