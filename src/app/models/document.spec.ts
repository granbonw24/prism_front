import { Document } from '@models/document';

describe('Document', () => {
  it('should create an instance', () => {
    const model: Document = { id: 1, libelle: 'Document test' };
    expect(model.id).toBe(1);
    expect(model.libelle).toBe('Document test');
  });
});
