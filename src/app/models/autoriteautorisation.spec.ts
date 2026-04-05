import { Autoriteautorisation } from '@models/autoriteautorisation';

describe('Autoriteautorisation', () => {
  it('should create an instance', () => {
    const model: Autoriteautorisation = { id: 1, libelle: 'Autorite autorisation test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Autorite autorisation test');
  });
});
