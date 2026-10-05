import { groupEffectifNumericParts } from './effectif-field-groups.util';

const ALPHA_PARTS = [
  { key: 'effectifAlphaMoins15F', label: 'Moins 15 F', type: 'number' as const },
  { key: 'effectifAlphaMoins15H', label: 'Moins 15 H', type: 'number' as const },
  { key: 'effectifAlphaMoins15IvoirienH', label: 'Moins 15 Ivoirien H', type: 'number' as const },
  { key: 'effectifAlphaMoins15IvoirienF', label: 'Moins 15 Ivoirien F', type: 'number' as const },
  { key: 'effectifAlphaMoins15HandicapH', label: 'Moins 15 Handicap H', type: 'number' as const },
  { key: 'effectifAlphaMoins15HandicapF', label: 'Moins 15 Handicap F', type: 'number' as const },
  { key: 'effectifAlpha1524F', label: '15-24 F', type: 'number' as const },
];

const CP_PARTS = [
  { key: 'effectifCp911IvoirienH', label: '9-11 Ivoirien Garçon', type: 'number' as const },
  { key: 'effectifCp911HandicapH', label: '9-11 Handicap Garçon', type: 'number' as const },
  { key: 'effectifCp911NonIvoirienH', label: '9-11 Non Ivoirien Garçon', type: 'number' as const },
];

describe('groupEffectifNumericParts', () => {
  it('Alpha : Hommes puis Femmes, natures en sous-blocs', () => {
    const groups = groupEffectifNumericParts(ALPHA_PARTS);
    expect(groups.map((g) => g.id)).toEqual(['hommes', 'femmes']);
    expect(groups[0].children?.map((g) => g.id)).toEqual(['h-age', 'h-ivoirien', 'h-handicap']);
    expect(groups[0].children?.[0].fields.map((f) => f.key)).toEqual(['effectifAlphaMoins15H']);
    expect(groups[1].children?.map((g) => g.id)).toEqual(['f-age', 'f-ivoirien', 'f-handicap']);
    expect(groups[1].children?.[0].fields.map((f) => f.key)).toEqual([
      'effectifAlphaMoins15F',
      'effectifAlpha1524F',
    ]);
  });

  it('CP : Hommes — ivoiriens, non-ivoiriens, handicap', () => {
    const groups = groupEffectifNumericParts(CP_PARTS);
    expect(groups.map((g) => g.id)).toEqual(['hommes']);
    expect(groups[0].children?.map((g) => g.id)).toEqual(['h-ivoirien', 'h-non-ivoirien', 'h-handicap']);
  });
});
