import { Routes } from '@angular/router';
import { REFERENTIEL_ROUTE_DATA } from '@core/config/referentiel-routes.data';
import { REFERENTIEL_LIST_PAGE_BY_PATH } from '@features/parametrage/referentiel-list-page.registry';

/**
 * Paramétrage : une classe composant par référentiel (`features/parametrage/`), données dans `route.data`.
 * Années scolaires : routes dédiées sous `parametrage/others/anne-scolaire/`.
 */
export const referentielFeatureRoutes: Routes = REFERENTIEL_ROUTE_DATA.filter((r) => r.path !== 'anneescolaire').map(
  (r) => {
    const component = REFERENTIEL_LIST_PAGE_BY_PATH[r.path];
    if (!component) {
      throw new Error(`REFERENTIEL_LIST_PAGE_BY_PATH manquant pour path="${r.path}"`);
    }
    return {
      path: r.path,
      component,
      data: {
        title: r.title,
        apiPath: r.apiPath,
        permissionFeature: r.permissionFeature ?? null,
        workflowFeature: r.workflowFeature ?? null,
        createFields: r.createFields ?? [],
        columnLabels: r.columnLabels ?? {},
      },
    };
  },
);
