import { Competence } from '@models/competence';

describe('Competence', () => {
  it('should create an instance', () => {
    const model: Competence = { id: 1, libelle: 'Competence test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Competence test');
  });
});
