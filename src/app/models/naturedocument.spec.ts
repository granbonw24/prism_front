import { Naturedocument } from '@models/naturedocument';

describe('Naturedocument', () => {
  it('should create an instance', () => {
    const model: Naturedocument = { id: 1, libelle: 'Nature document test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Nature document test');
  });
});
