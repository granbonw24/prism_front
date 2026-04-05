import type { Anneescolaire } from '@models/anneescolaire';

describe('Anneescolaire (modele)', () => {
  it("accepte un objet conforme a l'API", () => {
    const a: Anneescolaire = {
      id: 1,
      codeAnneeScolaire: 'AS24',
      debutAnneeScolaire: '2024-09-01',
      finAnneeScolaire: '2025-06-30',
      etatAnneeScolaire: true,
    };
    expect(a.id).toBe(1);
    expect(a.codeAnneeScolaire).toBe('AS24');
  });
});
