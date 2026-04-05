import { Domaineactivite } from '@models/domaineactivite';

describe('Domaineactivite', () => {
  it('should create an instance', () => {
    const model: Domaineactivite = { id: 1, libelle: 'Domaine activite test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Domaine activite test');
  });
});
