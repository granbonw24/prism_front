import {
  validateurCentralDisplayName,
  validateurCoordDisplayName,
  validateurSupDisplayName,
} from './saisie-validateur.util';

describe('saisie-validateur.util', () => {
  it('préfère le nom affiché au login validateur coord.', () => {
    expect(
      validateurCoordDisplayName({ valideCoordNom: 'Jean Yao', workflowValideCoordPar: 'coord1' }),
    ).toBe('Jean Yao');
  });

  it('retombe sur le login si le nom est absent', () => {
    expect(validateurCoordDisplayName({ workflowValideCoordPar: 'coord1' })).toBe('coord1');
  });

  it('affiche un tiret si aucun validateur coord.', () => {
    expect(validateurCoordDisplayName({})).toBe('—');
  });

  it('résout superviseur et central', () => {
    expect(validateurSupDisplayName({ valideSupNom: 'A. Sup' })).toBe('A. Sup');
    expect(validateurCentralDisplayName({ workflowValideCentralPar: 'dir1' })).toBe('dir1');
  });
});
