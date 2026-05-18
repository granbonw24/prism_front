import { Routes } from '@angular/router';
import { PARAMETRAGE_GROUP_FEATURE } from '@core/config/menu-rbac.config';
import { REFERENTIEL_ROUTE_DATA } from '@core/config/referentiel-routes.data';
import { withMenuPermission } from '@core/routing/route-permissions';
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
    const menuPermission = PARAMETRAGE_GROUP_FEATURE[r.menuGroup];
    return withMenuPermission(
      {
        path: r.path,
        component,
        data: {
          title: r.title,
          apiPath: r.apiPath,
          permissionFeature: r.permissionFeature ?? menuPermission,
          workflowFeature: r.workflowFeature ?? null,
          createFields: r.createFields ?? [],
          columnLabels: r.columnLabels ?? {},
        },
      },
      menuPermission,
    );
  },
);
