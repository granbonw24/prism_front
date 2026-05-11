import { groupReferentielsForMenu } from '@core/config/referentiel-menu.groups';
import { REFERENTIEL_ROUTE_DATA } from '@core/config/referentiel-routes.data';
import { REFERENTIEL_LIST_PAGE_BY_PATH } from './referentiel-list-page.registry';

/**
 * Tests « fonctionnels légers » : cohérence menu Paramétrage ↔ routes ↔ registre des pages.
 * Complément manuel : navigation sidebar sur chaque groupe et chaque entrée.
 */
describe('Paramétrage (référentiels)', () => {
  it('chaque entrée a menuGroup et une page dédiée (sauf années scolaires hors générique)', () => {
    for (const r of REFERENTIEL_ROUTE_DATA) {
      expect(r.menuGroup).toBeTruthy();
      if (r.path === 'anneescolaire') {
        expect(REFERENTIEL_LIST_PAGE_BY_PATH[r.path]).toBeUndefined();
      } else {
        expect(REFERENTIEL_LIST_PAGE_BY_PATH[r.path]).withContext(`path=${r.path}`).toBeTruthy();
      }
    }
    expect(Object.keys(REFERENTIEL_LIST_PAGE_BY_PATH).length).toBe(REFERENTIEL_ROUTE_DATA.length - 1);
  });

  it('groupReferentielsForMenu partitionne toutes les entrées sans doublon ni perte', () => {
    const grouped = groupReferentielsForMenu(REFERENTIEL_ROUTE_DATA);
    const flat = grouped.flatMap((g) => g.items);
    expect(flat.length).toBe(REFERENTIEL_ROUTE_DATA.length);
    const seen = new Set<string>();
    for (const r of flat) {
      expect(seen.has(r.path)).withContext(`doublon path=${r.path}`).toBeFalse();
      seen.add(r.path);
    }
  });

  it('ordre menu : Géographie puis Centres & autorisations puis Pédagogie puis Documents puis Autres', () => {
    const grouped = groupReferentielsForMenu(REFERENTIEL_ROUTE_DATA);
    const titles = grouped.map((g) => g.title).join(' > ');
    expect(titles).toContain('Géographie');
    expect(titles.indexOf('Géographie')).toBeLessThan(titles.indexOf('Centres & autorisations'));
    expect(titles.indexOf('Centres & autorisations')).toBeLessThan(titles.indexOf('Pédagogie'));
    expect(titles.indexOf('Pédagogie')).toBeLessThan(titles.indexOf('Documents'));
    expect(titles.indexOf('Documents')).toBeLessThan(titles.indexOf('Autres'));
  });
});
