import { Materielalpha } from '@models/materielalpha';

describe('Materielalpha', () => {
  it('should create an instance', () => {
    const model: Materielalpha = { id: 1, libelle: 'Materiel alpha test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Materiel alpha test');
  });
});
