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
];
