import { Categorieappui } from '@models/categorieappui';

describe('Categorieappui', () => {
  it('should create an instance', () => {
    const model: Categorieappui = { id: 1, libelle: 'Categorie appui test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Categorie appui test');
  });
});
