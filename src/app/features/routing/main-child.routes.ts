/**
 * Routes affichées dans le `<router-outlet>` du `MainComponent`.
 *
 * Organisation :
 * - `core/` : transversal (guards, interceptors, tokens, config partagée).
 * - `shared/` : UI réutilisable (ex. liste référentiel générique).
 * - `features/<domaine>/` : une capacité métier (pages + `domain/` + `data-access/` + `*.routes.ts` si besoin).
 * - `features/routing/` : composition des routes par zone menu (lisible et évolutif).
 */
import { Routes } from '@angular/router';
import { anneeScolaireFeatureRoutes } from '@features/anneescolaire/anneescolaire.routes';
import { administrationFeatureRoutes } from '@features/routing/administration.routes';
import { apprenantFeatureRoutes } from '@features/routing/apprenant.routes';
import { centresFeatureRoutes } from '@features/routing/centres.routes';
import { dashboardFeatureRoutes } from '@features/routing/dashboard.routes';
import { partenairePlaceholderRoutes, sectionPlaceholderRoutes } from '@features/routing/placeholders.routes';
import { promoteursFeatureRoutes } from '@features/routing/promoteurs.routes';
import { referentielFeatureRoutes } from '@features/routing/referentiel.routes';

export const mainChildRoutes: Routes = [
  ...dashboardFeatureRoutes,
  ...anneeScolaireFeatureRoutes,
  ...referentielFeatureRoutes,
  ...centresFeatureRoutes,
  ...promoteursFeatureRoutes,
  ...administrationFeatureRoutes,
  ...partenairePlaceholderRoutes,
  ...apprenantFeatureRoutes,
  ...sectionPlaceholderRoutes,
];
