import { Typedocument } from '@models/typedocument';

describe('Typedocument', () => {
  it('should create an instance', () => {
    const model: Typedocument = { id: 1, libelle: 'Type document test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Type document test');
  });
});
