import { UtilisateursComponent } from './utilisateurs.component';

describe('UtilisateursComponent circonscription filtering', () => {
  let component: UtilisateursComponent;

  beforeEach(() => {
    component = new UtilisateursComponent({} as never);
    component.drenas = [
      { id: 1, code: 'D1', libelle: 'DRENA 1' },
      { id: 2, code: 'D2', libelle: 'DRENA 2' },
    ];
    component.ieps = [
      { id: 10, code: 'I1', libelle: 'IEPP 1', drena: { id: 1 } },
      { id: 20, code: 'I2', libelle: 'IEPP 2', drena: { id: 2 } },
    ];
    component.departements = [
      { id: 100, code: 'DEP1', libelle: 'Département 1', region: { id: 1000 } },
      { id: 200, code: 'DEP2', libelle: 'Département 2', region: { id: 2000 } },
    ];
    component.drenaDepartements = [
      { id: 1, drena: { id: 1 }, departement: { id: 100 } },
      { id: 2, drena: { id: 2 }, departement: { id: 200 } },
    ];
    component.sousPrefectures = [
      { id: 1001, code: 'SP1', libelle: 'Sous-préfecture 1', departement: { id: 100 } },
      { id: 2001, code: 'SP2', libelle: 'Sous-préfecture 2', departement: { id: 200 } },
    ];
    component.communes = [
      { id: 3001, code: 'C1', libelle: 'Commune 1' },
      { id: 3002, code: 'C2', libelle: 'Commune 2' },
    ];
    component.localites = [
      {
        id: 4001,
        code: 'L1',
        libelle: 'Localité 1',
        sousPrefecture: { id: 1001 },
        commune: { id: 3001 },
      },
      {
        id: 4002,
        code: 'L2',
        libelle: 'Localité 2',
        sousPrefecture: { id: 2001 },
        commune: { id: 3002 },
      },
    ];
  });

  it('filtre les enfants et vide les anciennes sélections incompatibles quand la DRENA change', () => {
    const form = {
      username: 'demo',
      password: 'secret',
      idDrena: null,
      idIep: 20,
      idDepartement: 200,
      idSousPrefecture: 2001,
      idCommune: 3002,
      idLocalite: 4002,
    };

    component.onScopeChanged(form, 'idDrena', 1);

    expect(component.filteredScopeOptions('idIep', form).map((option) => option.id)).toEqual([10]);
    expect(component.filteredScopeOptions('idDepartement', form).map((option) => option.id)).toEqual([100]);
    expect(form.idIep).toBeNull();
    expect(form.idDepartement).toBeNull();
    expect(form.idSousPrefecture).toBeNull();
    expect(form.idCommune).toBeNull();
    expect(form.idLocalite).toBeNull();
  });

  it('filtre les DRENA et les IEPP depuis la région sélectionnée', () => {
    const form = {
      username: 'demo',
      password: 'secret',
      idRegion: null,
      idDrena: 2,
      idIep: 20,
      idDepartement: 200,
      idSousPrefecture: 2001,
      idCommune: 3002,
      idLocalite: 4002,
    };

    component.onScopeChanged(form, 'idRegion', 1000);

    expect(component.filteredScopeOptions('idDrena', form).map((option) => option.id)).toEqual([1]);
    expect(component.filteredScopeOptions('idIep', form).map((option) => option.id)).toEqual([10]);
    expect(form.idDrena).toBeNull();
    expect(form.idIep).toBeNull();
    expect(form.idDepartement).toBeNull();
    expect(form.idSousPrefecture).toBeNull();
    expect(form.idCommune).toBeNull();
    expect(form.idLocalite).toBeNull();
  });

  it('filtre les sous-préfectures, communes et localités depuis le département sélectionné', () => {
    const form = {
      username: 'demo',
      password: 'secret',
      idDepartement: 100,
      idSousPrefecture: null,
      idCommune: null,
      idLocalite: null,
    };

    expect(component.filteredScopeOptions('idSousPrefecture', form).map((option) => option.id)).toEqual([1001]);
    expect(component.filteredScopeOptions('idCommune', form).map((option) => option.id)).toEqual([3001]);
    expect(component.filteredScopeOptions('idLocalite', form).map((option) => option.id)).toEqual([4001]);
  });
});
