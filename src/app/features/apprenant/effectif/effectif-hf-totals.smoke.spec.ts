import { EFFECTIF_ADMIS_INTEGRATION_CP_CREATE_FIELDS } from './effectif-integration-forms.data';
import { EFFECTIF_ABANDON_CP_CREATE_FIELDS } from './effectif-satellite-forms.data';

/**
 * Harmonisation Effectif total H / F sur les formulaires Apprenant.
 */
describe('Effectifs — totaux H/F (métier)', () => {
  function assertHfTotals(
    fields: Array<{ key: string; label?: string; effectifRole?: string; hidden?: boolean }>,
    keys: { h: string; f: string; legacy: string },
  ): void {
    const h = fields.find((f) => f.key === keys.h);
    const f = fields.find((f) => f.key === keys.f);
    const legacy = fields.find((f) => f.key === keys.legacy);
    expect(h?.effectifRole).withContext(keys.h).toBe('total');
    expect(f?.effectifRole).withContext(keys.f).toBe('total');
    expect(h?.label).toContain('(H)');
    expect(f?.label).toContain('(F)');
    expect(legacy?.effectifRole).toBe('legacyTotal');
    expect(legacy?.hidden).toBeTrue();
  }

  it('abandon CP : Effectif total (H)/(F) + legacy synchronisé', () => {
    assertHfTotals(EFFECTIF_ABANDON_CP_CREATE_FIELDS, {
      h: 'effectifAbandonCpNiveauH',
      f: 'effectifAbandonCpNiveauF',
      legacy: 'effectifAbandonCpNiveauCp',
    });
  });

  it('admis intégration CP : Effectif total (H)/(F) + legacy', () => {
    assertHfTotals(EFFECTIF_ADMIS_INTEGRATION_CP_CREATE_FIELDS, {
      h: 'effectifAdmisIntegrationCpNiveauH',
      f: 'effectifAdmisIntegrationCpNiveauF',
      legacy: 'effectifAdmisIntegrationCpNiveauCp',
    });
  });

  it('ne laisse pas un total unique visible à la place des totaux H/F', () => {
    const visibleTotals = EFFECTIF_ABANDON_CP_CREATE_FIELDS.filter(
      (f) => f.effectifRole === 'total' && !f.hidden,
    );
    expect(visibleTotals.length).toBe(2);
    expect(visibleTotals.every((f) => /\(H\)|\(F\)/.test(f.label ?? ''))).toBeTrue();
  });
});
