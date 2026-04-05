import { Credential } from '@models/credential';

describe('Credential', () => {
  it('should create an instance', () => {
    const model: Credential = { id: 1, libelle: 'Credential test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Credential test');
  });
});
