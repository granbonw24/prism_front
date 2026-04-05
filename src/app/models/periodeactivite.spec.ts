import { Periodeactivite } from '@models/periodeactivite';

describe('Periodeactivite', () => {
  it('should create an instance', () => {
    const model: Periodeactivite = { id: 1, libelle: 'Periode activite test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Periode activite test');
  });
});
