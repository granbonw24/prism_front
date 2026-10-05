import {
  canShowWorkflowMutatingActions,
  isSubordinateWorkflowEditable,
  isWorkflowQueueReadOnly,
} from './workflow-row-actions.util';

describe('workflow-row-actions.util', () => {
  it('TERMINE est en lecture seule', () => {
    expect(isWorkflowQueueReadOnly({ workflowOnglet: 'TERMINE' })).toBeTrue();
  });

  it('RETOURNE reste éditable pour le subalterne', () => {
    expect(isSubordinateWorkflowEditable({ workflowStatut: 'RETOURNE', workflowEditable: true })).toBeTrue();
  });

  it('masque les actions mutantes en TERMINE', () => {
    expect(canShowWorkflowMutatingActions({ workflowOnglet: 'TERMINE' })).toBeFalse();
    expect(canShowWorkflowMutatingActions({ workflowOnglet: 'ACTION' })).toBeTrue();
  });
});
