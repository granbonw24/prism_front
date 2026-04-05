import { Infrastruture } from '@models/infrastruture';

describe('Infrastruture', () => {
  it('should create an instance', () => {
    const model: Infrastruture = { id: 1, libelle: 'Infrastruture test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Infrastruture test');
  });
});
