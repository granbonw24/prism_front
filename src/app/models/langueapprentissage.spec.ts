import { Langueapprentissage } from '@models/langueapprentissage';

describe('Langueapprentissage', () => {
  it('should create an instance', () => {
    const model: Langueapprentissage = { id: 1, libelle: 'Langue apprentissage test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Langue apprentissage test');
  });
});
