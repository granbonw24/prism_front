import { workflowStatusBadgeClass, workflowStatusLabel } from './workflow-status-display.util';

describe('workflow-status-display.util', () => {
  it('priorise RETOURNE sur valideeCoordonnateur', () => {
    expect(
      workflowStatusLabel({
        workflowStatut: 'RETOURNE',
        valideeCoordonnateur: true,
      }),
    ).toBe('Retourné pour correction');
  });

  it('affiche retourné au conseiller pour le validateur auteur', () => {
    expect(
      workflowStatusLabel(
        { workflowStatut: 'RETOURNE', workflowDecidePar: 'sup1' },
        { username: 'sup1', validatorView: true },
      ),
    ).toBe('Retourné au conseiller');
  });

  it('classe RETOURNE en badge warning pour le conseiller', () => {
    expect(workflowStatusBadgeClass({ workflowStatut: 'RETOURNE' })).toBe('badge-warning');
  });

  it('classe retourné au conseiller en badge danger pour le validateur auteur', () => {
    expect(
      workflowStatusBadgeClass(
        { workflowStatut: 'RETOURNE', workflowDecidePar: 'sup1' },
        { username: 'sup1', validatorView: true },
      ),
    ).toBe('badge-danger');
  });
});
