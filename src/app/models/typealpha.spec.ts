import { Typealpha } from '@models/typealpha';

describe('Typealpha', () => {
  it('should create an instance', () => {
    const model: Typealpha = { id: 1, libelle: 'Type alpha test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Type alpha test');
  });
});
