import { Designation } from '@models/designation';

describe('Designation', () => {
  it('should create an instance', () => {
    const model: Designation = { id: 1, libelle: 'Designation test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Designation test');
  });
});
