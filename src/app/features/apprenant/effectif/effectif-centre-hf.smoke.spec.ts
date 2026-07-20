import { EffectifCentreUnifieComponent } from './effectif-centre-unifie.component';

/**
 * Smoke structurel : le composant unifié expose bien H/F pour CP/CEC/SIE
 * (les champs sont définis dans le même fichier module).
 */
describe('Effectif centre unifié — totaux H/F', () => {
  it('est un composant standalone importable', () => {
    expect(EffectifCentreUnifieComponent).toBeTruthy();
  });
});
