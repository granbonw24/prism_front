import {
  summarizeReturnAlertsByLabel,
  workflowReturnResourceLabel,
} from './workflow-return-alert.util';

describe('workflow-return-alert.util', () => {
  it('summarizeReturnAlertsByLabel regroupe par libellé métier', () => {
    const entries = summarizeReturnAlertsByLabel([
      { resourcePath: '/api/effectif-abandon-alpha', recordId: 7 },
      { resourcePath: '/api/effectif-alpha', recordId: 20 },
      { resourcePath: '/api/evaluation', recordId: 18 },
    ]);
    expect(entries.find((e) => e.label === 'Effectif abandon (Alpha)')?.count).toBe(1);
    expect(entries.find((e) => e.label === 'Évaluation périodique')?.count).toBe(1);
  });

  it('workflowReturnResourceLabel précise le module', () => {
    expect(workflowReturnResourceLabel('/api/effectif-abandon-cp')).toBe('Effectif abandon (CP)');
  });
});