import { Routes } from '@angular/router';
import { SectionPlaceholderComponent } from '@features/sections/section-placeholder.component';

export const partenairePlaceholderRoutes: Routes = [
  { path: 'partenaire/partenariat', component: SectionPlaceholderComponent, data: { title: 'Partenaire - Partenariat' } },
];

/** Sections menu sans écran métier : à remplacer par de vraies features quand le backend est prêt. */
export const sectionPlaceholderRoutes: Routes = [
  { path: 'performance', component: SectionPlaceholderComponent, data: { title: 'Performance' } },
  { path: 'control', component: SectionPlaceholderComponent, data: { title: 'Control' } },
  { path: 'visites/pointage', component: SectionPlaceholderComponent, data: { title: 'Visites - Point des visites' } },
  { path: 'visites/conseiller', component: SectionPlaceholderComponent, data: { title: 'Visites - Suivi du conseiller' } },
  { path: 'visites/superviseur', component: SectionPlaceholderComponent, data: { title: 'Visites - Suivi du superviseur' } },
  { path: 'visites/iepp', component: SectionPlaceholderComponent, data: { title: 'Visites - Suivi par l’IEPP' } },
  { path: 'evaluation-periodique', component: SectionPlaceholderComponent, data: { title: 'Évaluation périodique' } },
];
