import { Difficulte } from '@models/difficulte';

describe('Difficulte', () => {
  it('should create an instance', () => {
    const model: Difficulte = { id: 1, libelle: 'Difficulte test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Difficulte test');
  });
});
