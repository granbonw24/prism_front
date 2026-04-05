import { Statutpersonnel } from '@models/statutpersonnel';

describe('Statutpersonnel', () => {
  it('should create an instance', () => {
    const model: Statutpersonnel = { id: 1, libelle: 'Statut personnel test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Statut personnel test');
  });
});
