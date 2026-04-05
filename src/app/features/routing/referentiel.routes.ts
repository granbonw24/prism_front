import { Routes } from '@angular/router';
import { REFERENTIEL_ROUTE_DATA } from '@core/config/referentiel-routes.data';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

/**
 * Paramétrage : écrans génériques pilotés par `REFERENTIEL_ROUTE_DATA`.
 * Les fonctionnalités migrées hors générique (ex. années scolaires) sont exclues ici.
 */
export const referentielFeatureRoutes: Routes = REFERENTIEL_ROUTE_DATA.filter((r) => r.path !== 'anneescolaire').map(
  (r) => ({
    path: r.path,
    component: ReferentielListPageComponent,
    data: {
      title: r.title,
      apiPath: r.apiPath,
      createFields: r.createFields ?? [],
    },
  }),
);
