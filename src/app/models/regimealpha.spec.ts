import { Regimealpha } from '@models/regimealpha';

describe('Regimealpha', () => {
  it('should create an instance', () => {
    const model: Regimealpha = { id: 1, libelle: 'Regime alpha test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Regime alpha test');
  });
});
