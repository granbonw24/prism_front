import { Routes } from '@angular/router';
import { AlphaCentresComponent } from '@features/centres/alpha/alpha-centres.component';
import { SimpleCentreTypePageComponent } from '@features/centres/simple-centre-type-page.component';

export const centresFeatureRoutes: Routes = [
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
];
