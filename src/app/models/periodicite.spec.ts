import { Periodicite } from '@models/periodicite';

describe('Periodicite', () => {
  it('should create an instance', () => {
    const model: Periodicite = { id: 1, libelle: 'Periodicite test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Periodicite test');
  });
});
