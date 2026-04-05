import { Partenaire } from '@models/partenaire';

describe('Partenaire', () => {
  it('should create an instance', () => {
    const model: Partenaire = { id: 1, libelle: 'Partenaire test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Partenaire test');
  });
});
