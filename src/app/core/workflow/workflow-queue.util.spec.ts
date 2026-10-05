import { collectConseillerFilterOptions, resolveRowConseillerLogin } from './workflow-queue.util';

describe('workflow-queue auteur filter', () => {
  it('préfère enregistrePar puis affiche le nom du conseiller', () => {
    const row = {
      enregistrePar: 'cons1',
      workflowProprietaire: 'other',
      conseillerNom: 'Awa Kone',
    };
    expect(resolveRowConseillerLogin(row)).toBe('cons1');
    expect(collectConseillerFilterOptions([row])).toEqual([{ value: 'cons1', label: 'Awa Kone' }]);
  });
});
