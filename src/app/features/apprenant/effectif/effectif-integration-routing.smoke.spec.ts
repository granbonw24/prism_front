import { EffectifIntegrationUnifieComponent } from './effectif-integration-unifie.component';
import { apprenantFeatureRoutes } from '../../routing/apprenant.routes';

describe('Apprenant effectifs intégration routes', () => {
  const expectedRoutes = [
    {
      path: 'apprenant/promus',
      initialKind: 'promuSie',
      kinds: ['promuSie', 'promuCec'],
    },
    {
      path: 'apprenant/reverse-formel-sie',
      initialKind: 'reverseSie',
      kinds: ['reverseSie'],
    },
    {
      path: 'apprenant/admis-cepe',
      initialKind: 'cepeCec',
      kinds: ['cepeCec', 'cepeCp'],
    },
    {
      path: 'apprenant/integres-formel-cp',
      initialKind: 'formelCp',
      kinds: ['formelCp'],
    },
    {
      path: 'apprenant/admis-test-integration-cp',
      initialKind: 'admisCp',
      kinds: ['admisCp'],
    },
  ];

  it('expose chaque sous-menu demandé vers le composant unifié', () => {
    for (const expected of expectedRoutes) {
      const route = apprenantFeatureRoutes.find((item) => item.path === expected.path);
      expect(route).withContext(`route ${expected.path}`).toBeTruthy();
      expect(route?.component).toBe(EffectifIntegrationUnifieComponent);
      expect(route?.data?.['initialKind']).toBe(expected.initialKind);
      expect(route?.data?.['kinds']).toEqual(expected.kinds);
      expect(route?.data?.['subtitle']).toBeTruthy();
    }
  });
});
