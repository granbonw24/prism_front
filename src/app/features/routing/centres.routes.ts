import { Routes } from '@angular/router';
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { withMenuPermission } from '@core/routing/route-permissions';
import { AlphaCentresComponent } from '@features/centres/alpha/alpha-centres.component';
import { SimpleCentreTypePageComponent } from '@features/centres/simple-centre-type-page.component';

export const centresFeatureRoutes: Routes = [
  withMenuPermission(
    {
      path: 'centres/alpha/nouveau',
      component: AlphaCentresComponent,
      data: {
        mode: 'create',
        title: "Centres d'Alphabétisation",
        createTitle: "Enregistrement d'un centre d'Alphabétisation",
        subtitle: 'Assistant d’enregistrement en 4 étapes',
        listPath: '/centres/alpha',
        createPath: '/centres/alpha/nouveau',
        createInitiallyOpen: true,
      },
    },
    MENU_FEATURES.CENTRES_ALPHA,
  ),
  withMenuPermission(
    {
      path: 'centres/alpha',
      component: AlphaCentresComponent,
      data: {
        mode: 'list',
        title: "Centres d'Alphabétisation",
        createPath: '/centres/alpha/nouveau',
        listPath: '/centres/alpha',
      },
    },
    MENU_FEATURES.CENTRES_ALPHA,
  ),
  withMenuPermission(
    {
      path: 'centres/cec/nouveau',
      component: SimpleCentreTypePageComponent,
      data: {
        mode: 'create',
        title: "Centres d'Éducation Communautaire",
        createTitle: "Enregistrement d'un centre d'Éducation Communautaire",
        subtitle: 'Assistant d’enregistrement en 4 étapes',
        apiPath: '/api/cec',
        listPath: '/centres/cec',
        createInitiallyOpen: true,
      },
    },
    MENU_FEATURES.CENTRES_CEC,
  ),
  withMenuPermission(
    {
      path: 'centres/cec',
      component: SimpleCentreTypePageComponent,
      data: {
        mode: 'list',
        title: "Centres d'Éducation Communautaire",
        apiPath: '/api/cec',
        createPath: '/centres/cec/nouveau',
        listPath: '/centres/cec',
      },
    },
    MENU_FEATURES.CENTRES_CEC,
  ),
  withMenuPermission(
    {
      path: 'centres/cp/nouveau',
      component: SimpleCentreTypePageComponent,
      data: {
        mode: 'create',
        title: 'Classes Passerelle',
        createTitle: "Enregistrement d'une classe passerelle",
        subtitle: 'Assistant d’enregistrement en 4 étapes',
        apiPath: '/api/cp',
        listPath: '/centres/cp',
        createInitiallyOpen: true,
      },
    },
    MENU_FEATURES.CENTRES_CP,
  ),
  withMenuPermission(
    {
      path: 'centres/cp',
      component: SimpleCentreTypePageComponent,
      data: {
        mode: 'list',
        title: 'Classes Passerelle',
        apiPath: '/api/cp',
        createPath: '/centres/cp/nouveau',
        listPath: '/centres/cp',
      },
    },
    MENU_FEATURES.CENTRES_CP,
  ),
  withMenuPermission(
    {
      path: 'centres/sie/nouveau',
      component: SimpleCentreTypePageComponent,
      data: {
        mode: 'create',
        title: 'Centres SIE',
        createTitle: "Enregistrement d'un centre SIE",
        subtitle: 'Assistant d’enregistrement en 4 étapes',
        apiPath: '/api/sie',
        listPath: '/centres/sie',
        createInitiallyOpen: true,
      },
    },
    MENU_FEATURES.CENTRES_SIE,
  ),
  withMenuPermission(
    {
      path: 'centres/sie',
      component: SimpleCentreTypePageComponent,
      data: {
        mode: 'list',
        title: 'Centres SIE',
        apiPath: '/api/sie',
        createPath: '/centres/sie/nouveau',
        listPath: '/centres/sie',
      },
    },
    MENU_FEATURES.CENTRES_SIE,
  ),
];
