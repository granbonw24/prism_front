import { Civilite } from '@models/civilite';

describe('Civilite', () => {
  it('should create an instance', () => {
    const model: Civilite = { id: 1, libelle: 'Civilite test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Civilite test');
  });
});
