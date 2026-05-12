import { Routes } from '@angular/router';
import { EffectifAbandonUnifieComponent } from '@features/apprenant/effectif/effectif-abandon-unifie.component';
import { EffectifCentreUnifieComponent } from '@features/apprenant/effectif/effectif-centre-unifie.component';
import { EffectifCompetenceCentrePageComponent } from '@features/apprenant/effectif/effectif-competence-centre-page.component';
import { EffectifHandicapUnifieComponent } from '@features/apprenant/effectif/effectif-handicap-unifie.component';
import { EffectifIntegrationUnifieComponent } from '@features/apprenant/effectif/effectif-integration-unifie.component';
import { EffectifPassageAlphaPageComponent } from '@features/apprenant/effectif/effectif-passage-alpha-page.component';

export const apprenantFeatureRoutes: Routes = [
  { path: 'apprenant/effectif', component: EffectifCentreUnifieComponent },
  { path: 'apprenant/abandon', component: EffectifAbandonUnifieComponent },
  { path: 'apprenant/passage', component: EffectifPassageAlphaPageComponent },
  { path: 'apprenant/handicap', component: EffectifHandicapUnifieComponent },
  { path: 'apprenant/competences', component: EffectifCompetenceCentrePageComponent },
  { path: 'apprenant/integrations', component: EffectifIntegrationUnifieComponent },
  {
    path: 'apprenant/promus',
    component: EffectifIntegrationUnifieComponent,
    data: {
      initialKind: 'promuSie',
      kinds: ['promuSie', 'promuCec'],
      subtitle: 'Effectifs promus pour les centres SIE et CEC.',
    },
  },
  {
    path: 'apprenant/reverse-formel-sie',
    component: EffectifIntegrationUnifieComponent,
    data: {
      initialKind: 'reverseSie',
      kinds: ['reverseSie'],
      subtitle: 'Effectifs reversés dans le formel pour les centres SIE.',
    },
  },
  {
    path: 'apprenant/admis-cepe',
    component: EffectifIntegrationUnifieComponent,
    data: {
      initialKind: 'cepeCec',
      kinds: ['cepeCec', 'cepeCp'],
      subtitle: 'Effectifs candidats et admis au CEPE pour les centres CEC et CP.',
    },
  },
  {
    path: 'apprenant/integres-formel-cp',
    component: EffectifIntegrationUnifieComponent,
    data: {
      initialKind: 'formelCp',
      kinds: ['formelCp'],
      subtitle: 'Effectifs intégrés dans le formel pour les centres CP.',
    },
  },
  {
    path: 'apprenant/admis-test-integration-cp',
    component: EffectifIntegrationUnifieComponent,
    data: {
      initialKind: 'admisCp',
      kinds: ['admisCp'],
      subtitle: 'Effectifs admis au test d’intégration pour les centres CP.',
    },
  },
];
