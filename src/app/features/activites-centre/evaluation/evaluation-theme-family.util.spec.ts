import {
  deduceComplementaryCounts,
  evaluationThemeFamilyKey,
  evaluationThemeFamilyTitle,
  groupEvaluationThemesByFamily,
  isComplementaryEvaluationTheme,
} from './evaluation-theme-family.util';

describe('evaluation-theme-family.util', () => {
  it('relie Sait lire et Ne sait pas lire à la même famille', () => {
    expect(evaluationThemeFamilyKey({ libelle: 'Sait lire' })).toBe('SAIT_LIRE');
    expect(evaluationThemeFamilyKey({ libelle: 'Ne sait pas lire' })).toBe('SAIT_LIRE');
    expect(isComplementaryEvaluationTheme({ libelle: 'Ne sait pas lire' })).toBeTrue();
    expect(evaluationThemeFamilyTitle('Sait lire', 'SAIT_LIRE')).toBe('Lire');
  });

  it('relie les autres couples du livret', () => {
    expect(evaluationThemeFamilyKey({ libelle: 'Sait écrire' })).toBe(
      evaluationThemeFamilyKey({ libelle: 'Ne sait pas écrire' }),
    );
    expect(evaluationThemeFamilyKey({ libelle: 'Sait calculer' })).toBe(
      evaluationThemeFamilyKey({ libelle: 'Ne sait calculer' }),
    );
    expect(evaluationThemeFamilyKey({ libelle: 'Sait lire un texte' })).toBe(
      evaluationThemeFamilyKey({ libelle: 'Ne sait pas lire un texte' }),
    );
    expect(evaluationThemeFamilyKey({ libelle: 'Comprend un texte' })).toBe(
      evaluationThemeFamilyKey({ libelle: 'Ne comprend pas un texte' }),
    );
    expect(evaluationThemeFamilyKey({ libelle: 'Résoud une situation problème' })).toBe(
      evaluationThemeFamilyKey({ libelle: 'Ne Résoud une situation problème' }),
    );
  });

  it('retombe sur le code TEV si le libellé est vide', () => {
    expect(evaluationThemeFamilyKey({ code: 'TEV-N1-SAIT-LIRE' })).toBe('SAIT_LIRE');
    expect(evaluationThemeFamilyKey({ code: 'TEV-N1-NE-SAIT-PAS-LIRE' })).toBe('SAIT_LIRE');
  });

  it('regroupe positif puis complémentaire', () => {
    const groups = groupEvaluationThemesByFamily(
      [
        { id: 1, libelle: 'Sait lire' },
        { id: 2, libelle: 'Ne sait pas lire' },
        { id: 3, libelle: 'Sait écrire' },
      ],
      (item) => item,
    );
    expect(groups.map((g) => g.title)).toEqual(['Lire', 'Écrire']);
    expect(groups[0].paired).toBeTrue();
    expect(groups[0].positive?.id).toBe(1);
    expect(groups[0].negative?.id).toBe(2);
    expect(groups[1].paired).toBeFalse();
  });

  it('déduit ne sait pas lire = total − sait lire', () => {
    const positive = { nombreTotalEvalue: 40, nombreResultatObtenu: 25, taux: null as number | null };
    const negative = { nombreTotalEvalue: null as number | null, nombreResultatObtenu: null as number | null, taux: null as number | null };
    deduceComplementaryCounts(positive, negative);
    expect(negative.nombreTotalEvalue).toBe(40);
    expect(negative.nombreResultatObtenu).toBe(15);
    expect(positive.taux).toBe(63);
    expect(negative.taux).toBe(38);
  });
});
