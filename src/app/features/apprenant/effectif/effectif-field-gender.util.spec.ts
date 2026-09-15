import { effectifFieldGender, isEffectifGenderPartitionPart } from './effectif-field-gender.util';
import { EFFECTIF_CEPE_CEC_CREATE_FIELDS, EFFECTIF_CEPE_CP_CREATE_FIELDS } from './effectif-integration-forms.data';

const ALPHA_FIELDS = [
  { key: 'effectifAlphaNiveauH' },
  { key: 'effectifAlphaNiveauF' },
  { key: 'effectifAlphaMoins15H' },
  { key: 'effectifAlphaMoins15F' },
  { key: 'effectifAlphaMoins15IvoirienH' },
  { key: 'effectifAlphaMoins15HandicapH' },
];

const CP_FIELDS = [
  { key: 'effectifCpNiveauH' },
  { key: 'effectifCpNiveauF' },
  { key: 'effectifCp911IvoirienH' },
  { key: 'effectifCp911NonIvoirienH' },
  { key: 'effectifCp911HandicapH' },
];

describe('effectifFieldGender', () => {
  it('détecte Garcon/Fille avant le suffixe Cec', () => {
    expect(effectifFieldGender('effectifCepeCandidatGarconCec')).toBe('H');
    expect(effectifFieldGender('effectifCepeCandidatFilleCec')).toBe('F');
    expect(effectifFieldGender('effectifCepeAdmisGarconCec')).toBe('H');
    expect(effectifFieldGender('effectifCepeAdmisFilleCec')).toBe('F');
  });

  it('détecte HCp / FCp', () => {
    expect(effectifFieldGender('effectifCepeCandidatHCp')).toBe('H');
    expect(effectifFieldGender('effectifCepeCandidatFCp')).toBe('F');
  });

  it('ignore les champs sans genre', () => {
    expect(effectifFieldGender('effectifCepeCandidatIvoirienCec')).toBeNull();
  });

  it('détecte une tranche d’âge terminée par H/F après un chiffre', () => {
    expect(effectifFieldGender('effectifAlphaMoins15H')).toBe('H');
    expect(effectifFieldGender('effectifAlphaMoins15F')).toBe('F');
  });
});

describe('isEffectifGenderPartitionPart — CEPE', () => {
  it('CEC : seuls les candidats H/F (pas handicap / admis / ivoiriens) comptent pour le total', () => {
    const parts = EFFECTIF_CEPE_CEC_CREATE_FIELDS.filter((f) =>
      isEffectifGenderPartitionPart(f, EFFECTIF_CEPE_CEC_CREATE_FIELDS),
    ).map((f) => f.key);
    expect(parts).toEqual(['effectifCepeCandidatFilleCec', 'effectifCepeCandidatGarconCec']);
  });

  it('CP : mêmes règles sur les clés HCp / FCp', () => {
    const parts = EFFECTIF_CEPE_CP_CREATE_FIELDS.filter((f) =>
      isEffectifGenderPartitionPart(f, EFFECTIF_CEPE_CP_CREATE_FIELDS),
    ).map((f) => f.key);
    expect(parts).toEqual(['effectifCepeCandidatFCp', 'effectifCepeCandidatHCp']);
  });
});

describe('isEffectifGenderPartitionPart — Alpha / CP', () => {
  it('Alpha : seules les tranches d’âge H/F partitionnent (pas ivoirien / handicap / totaux)', () => {
    const parts = ALPHA_FIELDS.filter((f) => isEffectifGenderPartitionPart(f, ALPHA_FIELDS)).map((f) => f.key);
    expect(parts).toEqual(['effectifAlphaMoins15H', 'effectifAlphaMoins15F']);
  });

  it('CP : ivoirien + non-ivoirien partitionnent, handicap est un sous-ensemble', () => {
    const parts = CP_FIELDS.filter((f) => isEffectifGenderPartitionPart(f, CP_FIELDS)).map((f) => f.key);
    expect(parts).toEqual(['effectifCp911IvoirienH', 'effectifCp911NonIvoirienH']);
  });
});
