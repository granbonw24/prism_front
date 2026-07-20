import {
  DOSSIER_CENTRE_LIAISON_CONFIGS,
  visibleLiaisonSections,
  type CentreType,
} from './dossier-centre-liaison.config';

/**
 * Tests métier dossier centre : mêmes sections pour Alpha / CEC / CP / SIE,
 * catalogues partagés, support didactique branché.
 */
describe('Dossier centre — éléments de dossier (métier)', () => {
  const expectedSections = [
    'difficultes',
    'impacts',
    'competences',
    'infrastructures',
    'ressources',
    'materiel',
    'supports',
    'langues',
  ];

  const centreTypes: CentreType[] = ['alpha', 'cec', 'cp', 'sie'];

  it('expose les sections attendues (y compris supports didactiques)', () => {
    const sections = DOSSIER_CENTRE_LIAISON_CONFIGS.map((c) => c.section);
    for (const s of expectedSections) {
      expect(sections).withContext(`section manquante: ${s}`).toContain(s);
    }
  });

  it('affiche les mêmes sections pour Alpha, CEC, CP et SIE', () => {
    for (const type of centreTypes) {
      const visible = visibleLiaisonSections(type).map((c) => c.section);
      expect(visible).withContext(`type=${type}`).toEqual(expectedSections);
    }
  });

  it('ne réserve plus de section à Alpha uniquement', () => {
    for (const cfg of DOSSIER_CENTRE_LIAISON_CONFIGS) {
      expect((cfg as { alphaOnly?: boolean }).alphaOnly)
        .withContext(`${cfg.section} encore alphaOnly`)
        .toBeFalsy();
    }
  });

  it('pointe chaque section vers une API liaison + catalogue', () => {
    for (const cfg of DOSSIER_CENTRE_LIAISON_CONFIGS) {
      expect(cfg.apiPath).withContext(cfg.section).toMatch(/^\/api\//);
      expect(cfg.catalogApiPath).withContext(cfg.section).toMatch(/^\/api\//);
      expect(cfg.centreRefKey).toBe('Centre');
    }
  });

  it('supporte le sync supports didactiques avec champ « autre »', () => {
    const supports = DOSSIER_CENTRE_LIAISON_CONFIGS.find((c) => c.section === 'supports');
    expect(supports?.apiPath).toBe('/api/support-didactique-alpha');
    expect(supports?.catalogApiPath).toBe('/api/SupportDidactiques');
    expect(supports?.fkField).toBe('idSupportDidactique');
    expect(supports?.extraFields?.some((f) => f.key === 'libelleAutreSupport')).toBeTrue();
  });

  it('utilise les mêmes catalogues métier (matériel pédagogique, langues, etc.)', () => {
    const materiel = DOSSIER_CENTRE_LIAISON_CONFIGS.find((c) => c.section === 'materiel');
    expect(materiel?.catalogApiPath).toBe('/api/materielpedagogiques');
    expect(materiel?.title).toContain('Matériel');
    const langues = DOSSIER_CENTRE_LIAISON_CONFIGS.find((c) => c.section === 'langues');
    expect(langues?.catalogApiPath).toBe('/api/LangueApprentissages/catalog');
  });
});
