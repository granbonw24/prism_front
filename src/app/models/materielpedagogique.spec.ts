import { Materielpedagogique } from '@models/materielpedagogique';

describe('Materielpedagogique', () => {
  it('should create an instance', () => {
    const model: Materielpedagogique = { id: 1, libelle: 'Materiel pedagogique test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Materiel pedagogique test');
  });
});
