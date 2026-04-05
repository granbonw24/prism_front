import { Routes } from '@angular/router';
import { AlphaCentresComponent } from '@features/centres/alpha/alpha-centres.component';
import { SimpleCentreTypePageComponent } from '@features/centres/simple-centre-type-page.component';

export const centresFeatureRoutes: Routes = [
  { path: 'centres/alpha', component: AlphaCentresComponent },
  {
    path: 'centres/cec',
    component: SimpleCentreTypePageComponent,
    data: { title: 'Centres CEC', apiPath: '/api/cec' },
  },
  {
    path: 'centres/cp',
    component: SimpleCentreTypePageComponent,
    data: { title: 'Centres CP', apiPath: '/api/cp' },
  },
  {
    path: 'centres/sie',
    component: SimpleCentreTypePageComponent,
    data: { title: 'Centres SIE', apiPath: '/api/sie' },
  },
];
