import { Naturecentre } from '@models/naturecentre';

describe('Naturecentre', () => {
  it('should create an instance', () => {
    const model: Naturecentre = { id: 1, libelle: 'Nature centre test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Nature centre test');
  });
});
