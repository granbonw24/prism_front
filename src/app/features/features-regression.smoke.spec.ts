import { REFERENTIEL_ROUTE_DATA } from '@core/config/referentiel-routes.data';
import { REFERENTIEL_LIST_PAGE_BY_PATH } from '@features/parametrage/referentiel-list-page.registry';
import { personnelFeatureRoutes } from '@features/routing/personnel.routes';
import { promoteursFeatureRoutes } from '@features/routing/promoteurs.routes';

describe('Régressions fonctionnelles (smoke)', () => {
  it('niveau d’étude : paramétrage sur niveau-personnel uniquement', () => {
    const paths = REFERENTIEL_ROUTE_DATA.map((r) => r.path);
    expect(paths).toContain('niveau-personnel');
    expect(paths).not.toContain('niveau-etude');
    expect(REFERENTIEL_LIST_PAGE_BY_PATH['niveau-personnel']).toBeTruthy();
    expect(REFERENTIEL_LIST_PAGE_BY_PATH['niveau-etude']).toBeUndefined();
    const np = REFERENTIEL_ROUTE_DATA.find((r) => r.path === 'niveau-personnel');
    expect(np?.apiPath).toBe('/api/niveau-personnel');
  });

  it('routes personnel séparées (liste / création / édition)', () => {
    const paths = personnelFeatureRoutes.map((r) => r.path);
    expect(paths).toContain('personnel');
    expect(paths).toContain('personnel/nouveau');
    expect(paths.some((p) => String(p).includes('modifier'))).toBeTrue();
  });

  it('route promoteurs dédiée', () => {
    expect(promoteursFeatureRoutes.some((r) => r.path === 'promoteurs')).toBeTrue();
  });
});
