import { Routes } from '@angular/router';
import { SectionPlaceholderComponent } from '@features/sections/section-placeholder.component';

export const partenairePlaceholderRoutes: Routes = [
  { path: 'partenaire/partenariat', component: SectionPlaceholderComponent, data: { title: 'Partenaire - Partenariat' } },
];

/** Sections menu sans écran métier : à remplacer par de vraies features quand le backend est prêt. */
export const sectionPlaceholderRoutes: Routes = [
  { path: 'performance', component: SectionPlaceholderComponent, data: { title: 'Performance' } },
  { path: 'control', component: SectionPlaceholderComponent, data: { title: 'Control' } },
  { path: 'evaluation-periodique', component: SectionPlaceholderComponent, data: { title: 'Évaluation périodique' } },
];
