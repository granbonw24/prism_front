import { Communaute } from '@models/communaute';

describe('Communaute', () => {
  it('should create an instance', () => {
    const model: Communaute = { id: 1, libelle: 'Communaute test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Communaute test');
  });
});
