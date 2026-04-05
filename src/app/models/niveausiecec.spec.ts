import { Niveausiecec } from '@models/niveausiecec';

describe('Niveausiecec', () => {
  it('should create an instance', () => {
    const model: Niveausiecec = { id: 1, libelle: 'Niveau sie cec test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Niveau sie cec test');
  });
});
