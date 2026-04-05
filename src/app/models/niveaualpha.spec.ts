import { Niveaualpha } from '@models/niveaualpha';

describe('Niveaualpha', () => {
  it('should create an instance', () => {
    const model: Niveaualpha = { id: 1, libelle: 'Niveau alpha test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Niveau alpha test');
  });
});
