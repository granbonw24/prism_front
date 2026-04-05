import { Fonction } from '@models/fonction';

describe('Fonction', () => {
  it('should create an instance', () => {
    const model: Fonction = { id: 1, libelle: 'Fonction test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Fonction test');
  });
});
