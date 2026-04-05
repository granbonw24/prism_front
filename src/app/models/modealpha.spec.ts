import { Modealpha } from '@models/modealpha';

describe('Modealpha', () => {
  it('should create an instance', () => {
    const model: Modealpha = { id: 1, libelle: 'Mode alpha test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Mode alpha test');
  });
});
