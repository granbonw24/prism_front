import {
  canActAsCurrentWorkflowValidator,
  workflowDecisionFeature,
} from './workflow-validator-gate.util';

describe('workflow-validator-gate.util', () => {
  it('autorise le coordonnateur sur SOUMIS', () => {
    expect(canActAsCurrentWorkflowValidator('SOUMIS', ['COORDONNATEUR'], true)).toBeTrue();
  });

  it('autorise le superviseur après validation coord.', () => {
    expect(
      canActAsCurrentWorkflowValidator('VALIDEE_COORDONNATEUR', ['SUPERVISEUR'], true),
    ).toBeTrue();
  });

  it('refuse sans permission VALIDER', () => {
    expect(canActAsCurrentWorkflowValidator('SOUMIS', ['COORDONNATEUR'], false)).toBeFalse();
  });

  it('choisit la feature coord. au palier SOUMIS', () => {
    expect(
      workflowDecisionFeature('SOUMIS', 'ACTIVITES_CENTRE_EVALUATION', 'VALIDATION_VISITES_CONSEILLER'),
    ).toBe('VALIDATION_VISITES_CONSEILLER');
  });

  it('utilise la feature module aux paliers supérieurs', () => {
    expect(
      workflowDecisionFeature('VALIDEE_COORDONNATEUR', 'ACTIVITES_CENTRE_EVALUATION', 'VALIDATION_VISITES_CONSEILLER'),
    ).toBe('ACTIVITES_CENTRE_EVALUATION');
  });
});
