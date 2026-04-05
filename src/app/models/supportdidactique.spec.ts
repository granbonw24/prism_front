import { Supportdidactique } from '@models/supportdidactique';

describe('Supportdidactique', () => {
  it('should create an instance', () => {
    const model: Supportdidactique = { id: 1, libelle: 'Support didactique test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Support didactique test');
  });
});
