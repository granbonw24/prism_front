import { Routes } from '@angular/router';
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { withMenuPermission } from '@core/routing/route-permissions';
import { ApprenantImportPageComponent } from '@features/apprenant/apprenant-import-page.component';
import { EffectifAbandonUnifieComponent } from '@features/apprenant/effectif/effectif-abandon-unifie.component';
import { EffectifCentreUnifieComponent } from '@features/apprenant/effectif/effectif-centre-unifie.component';
import { EffectifCentresPromusCpPageComponent } from '@features/apprenant/effectif/effectif-centres-promus-cp-page.component';
import { EffectifHandicapUnifieComponent } from '@features/apprenant/effectif/effectif-handicap-unifie.component';
import { EffectifIntegrationUnifieComponent } from '@features/apprenant/effectif/effectif-integration-unifie.component';
import { EffectifPassageAlphaPageComponent } from '@features/apprenant/effectif/effectif-passage-alpha-page.component';

export const apprenantFeatureRoutes: Routes = [
  withMenuPermission(
    { path: 'apprenant/effectif', component: EffectifCentreUnifieComponent },
    MENU_FEATURES.APPRENANT_EFFECTIF,
  ),
  withMenuPermission(
    { path: 'apprenant/import', component: ApprenantImportPageComponent },
    MENU_FEATURES.APPRENANT_EFFECTIF,
  ),
  withMenuPermission(
    { path: 'apprenant/abandon', component: EffectifAbandonUnifieComponent },
    MENU_FEATURES.APPRENANT_ABANDON,
  ),
  withMenuPermission(
    { path: 'apprenant/passage', component: EffectifPassageAlphaPageComponent },
    MENU_FEATURES.APPRENANT_PASSAGE,
  ),
  withMenuPermission(
    { path: 'apprenant/handicap', component: EffectifHandicapUnifieComponent },
    MENU_FEATURES.APPRENANT_HANDICAP,
  ),
  withMenuPermission(
    {
      path: 'apprenant/centres-promus',
      component: EffectifCentresPromusCpPageComponent,
    },
    MENU_FEATURES.APPRENANT_CENTRES_PROMUS,
  ),
  withMenuPermission(
    {
      path: 'apprenant/reverse-formel-sie',
      component: EffectifIntegrationUnifieComponent,
      data: {
        initialKind: 'reverseSie',
        kinds: ['reverseSie'],
        subtitle: 'Effectifs reversés dans le formel pour les centres SIE.',
      },
    },
    MENU_FEATURES.APPRENANT_REVERSE_FORMEL_SIE,
  ),
  withMenuPermission(
    {
      path: 'apprenant/admis-cepe',
      component: EffectifIntegrationUnifieComponent,
      data: {
        initialKind: 'cepeCec',
        kinds: ['cepeCec', 'cepeCp'],
        subtitle: 'Effectifs candidats et admis au CEPE pour les centres CEC et CP.',
      },
    },
    MENU_FEATURES.APPRENANT_ADMIS_CEPE,
  ),
  withMenuPermission(
    {
      path: 'apprenant/integres-formel-cp',
      component: EffectifIntegrationUnifieComponent,
      data: {
        initialKind: 'formelCp',
        kinds: ['formelCp'],
        subtitle: 'Effectifs intégrés dans le formel pour les centres CP.',
      },
    },
    MENU_FEATURES.APPRENANT_INTEGRES_FORMEL_CP,
  ),
  withMenuPermission(
    {
      path: 'apprenant/admis-test-integration-cp',
      component: EffectifIntegrationUnifieComponent,
      data: {
        initialKind: 'admisCp',
        kinds: ['admisCp'],
        subtitle: 'Effectifs admis au test d’intégration pour les centres CP.',
      },
    },
    MENU_FEATURES.APPRENANT_ADMIS_TEST_INTEGRATION_CP,
  ),
];
