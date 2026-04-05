import { Impact } from '@models/impact';

describe('Impact', () => {
  it('should create an instance', () => {
    const model: Impact = { id: 1, libelle: 'Impact test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Impact test');
  });
});
