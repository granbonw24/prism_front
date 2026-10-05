import {
  auteurColumnCount,
  canSeeCentralValidateur,
  canSeeConseillerAuteur,
  canSeeCoordonnateurAuteur,
  canSeeSuperviseurValidateur,
} from './saisie-auteur-visibility.util';

describe('saisie-auteur-visibility', () => {
  it('le coordonnateur voit le conseiller, pas le validateur coord.', () => {
    expect(canSeeConseillerAuteur(['COORDONNATEUR'])).toBeTrue();
    expect(canSeeCoordonnateurAuteur(['COORDONNATEUR'])).toBeFalse();
  });

  it('le superviseur voit conseiller et validateur coord.', () => {
    expect(canSeeConseillerAuteur(['SUPERVISEUR'])).toBeTrue();
    expect(canSeeCoordonnateurAuteur(['SUPERVISEUR'])).toBeTrue();
    expect(canSeeSuperviseurValidateur(['SUPERVISEUR'])).toBeFalse();
  });

  it('le directeur voit toute la chaîne validateurs', () => {
    expect(canSeeSuperviseurValidateur(['DIRECTEUR'])).toBeTrue();
    expect(canSeeCentralValidateur(['DIRECTEUR'])).toBeTrue();
  });

  it('le conseiller ne voit pas ces colonnes', () => {
    expect(canSeeConseillerAuteur(['CONSEILLER'])).toBeFalse();
    expect(canSeeCoordonnateurAuteur(['CONSEILLER'])).toBeFalse();
  });

  it('compte les colonnes auteur visibles', () => {
    expect(auteurColumnCount(['CONSEILLER'])).toBe(0);
    expect(auteurColumnCount(['COORDONNATEUR'])).toBe(1);
    expect(auteurColumnCount(['SUPERVISEUR'])).toBe(2);
    expect(auteurColumnCount(['DIRECTEUR'])).toBe(4);
  });
});
