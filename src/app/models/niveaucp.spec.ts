import { Niveaucp } from '@models/niveaucp';

describe('Niveaucp', () => {
  it('should create an instance', () => {
    const model: Niveaucp = { id: 1, libelle: 'Niveau cp test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Niveau cp test');
  });
});
