import { Diplome } from '@models/diplome';

describe('Diplome', () => {
  it('should create an instance', () => {
    const model: Diplome = { id: 1, libelle: 'Diplome test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Diplome test');
  });
});
