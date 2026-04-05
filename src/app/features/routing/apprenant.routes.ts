import { Routes } from '@angular/router';
import { EffectifCentreUnifieComponent } from '@features/apprenant/effectif/effectif-centre-unifie.component';
import { ReferentielListPageComponent } from '@shared/referentiel-list-page/referentiel-list-page.component';

export const apprenantFeatureRoutes: Routes = [
  { path: 'apprenant/effectif', component: EffectifCentreUnifieComponent },
  {
    path: 'apprenant/abandon',
    component: ReferentielListPageComponent,
    data: { title: 'Apprenant - Abandon', apiPath: '/api/effectif-abandon-alpha', createFields: [] },
  },
  {
    path: 'apprenant/passage',
    component: ReferentielListPageComponent,
    data: { title: 'Apprenant - Passage', apiPath: '/api/effectif-passage-alpha', createFields: [] },
  },
  {
    path: 'apprenant/handicap',
    component: ReferentielListPageComponent,
    data: { title: 'Apprenant - Handicap', apiPath: '/api/effectif-situation-handicap-alpha', createFields: [] },
  },
  {
    path: 'apprenant/competences',
    component: ReferentielListPageComponent,
    data: { title: 'Apprenant - Compétences acquises', apiPath: '/api/competence-centre', createFields: [] },
  },
];
