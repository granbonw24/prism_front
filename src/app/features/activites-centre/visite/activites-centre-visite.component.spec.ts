import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AuthService } from '@services/auth.service';
import { ActivitesCentreVisiteComponent } from './activites-centre-visite.component';

function flushPendingVisiteLoads(http: HttpTestingController, suiviPath: string, suiviBody: unknown): void {
  for (const req of http.match(() => true)) {
    const url = req.request.url;
    if (url.endsWith(suiviPath)) {
      req.flush(suiviBody as object);
    } else if (url.endsWith('/api/visite')) {
      req.flush([]);
    } else if (url.endsWith('/api/suivi-iepp')) {
      req.flush([]);
    } else if (url.endsWith('/api/suivi-superviseur')) {
      req.flush([]);
    } else if (url.endsWith('/api/PeriodeActivites')) {
      req.flush([{ id: 1, code: 'P1', libelle: 'Période test' }]);
    } else if (url.endsWith('/api/alpha')) {
      req.flush({ content: [{ idCentre: 10, codeAlpha: 'ALP-001', libelleAlpha: 'Centre Alpha' }] });
    } else if (url.endsWith('/api/niveaualpha')) {
      req.flush([{ id: 1, code: 'N1', libelle: 'Niveau 1' }]);
    } else if (url.endsWith('/api/saisie-workflows/claim')) {
      req.flush({});
    } else if (url.includes('/api/saisie-workflows/statuses')) {
      req.flush({});
    } else {
      req.flush([]);
    }
  }
}

describe('ActivitesCentreVisiteComponent', () => {
  let fixture: ComponentFixture<ActivitesCentreVisiteComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivitesCentreVisiteComponent, HttpClientTestingModule],
      providers: [
        { provide: API_BASE_URL, useValue: 'http://api.test' },
        { provide: AuthService, useValue: { hasPermission: () => true, hasAnyPermission: () => true } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                title: 'ACTIVITES CENTRE — Visite — Suivi par l’IEPP',
                mode: 'iepp',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitesCentreVisiteComponent);
    http = TestBed.inject(HttpTestingController);
  });

  it('charge les visites et configure les champs selon le mode de route', () => {
    fixture.detectChanges();

    const requests = http.match(() => true);
    expect(requests.length).toBe(4);
    flushPendingVisiteLoads(http, '/api/suivi-iepp', [
      {
        id: 1,
        alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
        periodeActivite: { id: 1, code: 'P1', libelle: 'Période test' },
        nombreVisiteEffectueParIepp: 3,
        nombreReunionPointActiviteAlpha: 2,
      },
    ]);

    http.verify();
    const component = fixture.componentInstance;
    expect(component.pageTitle).toBe('ACTIVITES CENTRE — Visite — Suivi par l’IEPP');
    expect(component.mode).toBe('iepp');
    expect(component.suiviFields.map((f) => f.key)).toEqual([
      'nombreVisiteEffectueParIepp',
      'nombreReunionPointActiviteAlpha',
    ]);
    expect(component.filteredRows.length).toBe(1);
  });

  it('masque les colonnes de maîtrise dans le tableau IEPP', () => {
    fixture.detectChanges();

    flushPendingVisiteLoads(http, '/api/suivi-iepp', [
      {
        id: 1,
        alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
        periodeActivite: { id: 1, code: 'P1', libelle: 'Période test' },
        nombreVisiteEffectueParIepp: 3,
        nombreReunionPointActiviteAlpha: 2,
      },
    ]);
    fixture.detectChanges();

    const headerText = Array.from(fixture.nativeElement.querySelectorAll('thead th') as NodeListOf<HTMLElement>)
      .map((cell) => cell.textContent?.trim())
      .join(' ');
    expect(headerText).not.toContain('Lecture');
    expect(headerText).not.toContain('Écriture');
    expect(headerText).not.toContain('Calcul');
    expect(headerText).not.toContain('CVC');
    http.verify();
  });

  it('agrège les lignes validées pour le suivi central AENF', () => {
    fixture.detectChanges();
    flushPendingVisiteLoads(http, '/api/suivi-iepp', []);

    const component = fixture.componentInstance;
    component.mode = 'centrale';
    component.reload();

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/visite')) {
        req.flush([
          {
            id: 1,
            alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
            nombreVisiteRealiseParConseiller: 1,
            nombreBulletinEffectueParConseiller: 1,
            valideeCoordonnateur: true,
          },
          {
            id: 2,
            alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
            valideeCoordonnateur: false,
          },
        ]);
      } else if (req.request.url.endsWith('/api/suivi-iepp')) {
        req.flush([
          {
            id: 3,
            alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
            nombreVisiteEffectueParIepp: 7,
            nombreReunionPointActiviteAlpha: 8,
            valideeIepp: true,
          },
        ]);
      } else if (req.request.url.endsWith('/api/suivi-superviseur')) {
        req.flush([
          {
            id: 4,
            alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
            nombreVisiteConseillerSuperviseurEffectue: 5,
            nombreReunionBilanConseillerSuperviseur: 10,
            valideeSuperviseur: true,
          },
        ]);
      } else if (req.request.url.endsWith('/api/PeriodeActivites')) {
        req.flush([{ id: 1, code: 'P1', libelle: 'Période test' }]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [{ idCentre: 10, codeAlpha: 'ALP-001', libelleAlpha: 'Centre Alpha' }] });
      } else if (req.request.url.endsWith('/api/niveaualpha')) {
        req.flush([{ id: 1, code: 'N1', libelle: 'Niveau 1' }]);
      }
    }

    expect(component.filteredRows.map((row) => component.centralSource(row))).toEqual([
      'Coordonnateur',
      'IEPP',
      'Superviseur',
    ]);
    expect(component.filteredRows.map((row) => component.validationIndicator(row))).toEqual([
      'Validé coordonnateur',
      'Validé IEPP',
      'Validé superviseur',
    ]);
    http.verify();
  });

  it('sépare le formulaire points des visites du formulaire suivi', () => {
    fixture.detectChanges();
    flushPendingVisiteLoads(http, '/api/suivi-iepp', []);

    const component = fixture.componentInstance;
    component.mode = 'conseiller';
    component.openCreate('points');
    expect(component.formMode).toBe('points');
    expect(component.formTitle).toBe('Créer les points des visites');

    component.openEdit(
      {
        id: 1,
        alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
      },
      'suivi',
    );
    expect(component.formMode).toBe('suivi');
    expect(component.formTitle).toBe('Modifier le suivi de visite');

    http.verify();
  });

  it('ouvre Ajouter suivi en création indépendante pour l’IEPP', () => {
    fixture.detectChanges();
    flushPendingVisiteLoads(http, '/api/suivi-iepp', [
      {
        id: 7,
        alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
        nombreVisiteEffectueParIepp: 3,
      },
    ]);

    const component = fixture.componentInstance;
    component.openCreate('suivi');

    expect(component.editTarget).toBeNull();
    expect(component.formMode).toBe('suivi');
    expect(component.formTitle).toBe('Créer le suivi de visite');
    http.verify();
  });

  it('demande une confirmation avant de valider une ligne', () => {
    fixture.detectChanges();
    flushPendingVisiteLoads(http, '/api/suivi-iepp', [
      {
        id: 7,
        alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
        nombreVisiteEffectueParIepp: 3,
        valideeIepp: false,
      },
    ]);

    const component = fixture.componentInstance;
    component.askValidation(component.rows[0]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Avez verifié les documents physique rattachés a cette valiation ?');
    http.expectNone('http://api.test/api/suivi-iepp/7/valider');

    component.validationConfirmed();
    const validate = http.expectOne('http://api.test/api/suivi-iepp/7/valider');
    expect(validate.request.method).toBe('PUT');
    validate.flush({ id: 7, valideeIepp: true });

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/suivi-iepp')) {
        req.flush([]);
      } else if (req.request.url.endsWith('/api/PeriodeActivites')) {
        req.flush([{ id: 1, code: 'P1', libelle: 'Période test' }]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [] });
      }
    }

    expect(component.validationTarget).toBeNull();
    http.verify();
  });

  it('envoie les évaluations de maîtrise au backend sous forme BONNE/MOYENNE/INSUFFISANT', () => {
    fixture.detectChanges();

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/suivi-iepp')) {
        req.flush([]);
      } else if (req.request.url.endsWith('/api/PeriodeActivites')) {
        req.flush([{ id: 1, code: 'P1', libelle: 'Période test' }]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [{ idCentre: 10, codeAlpha: 'ALP-001', libelleAlpha: 'Centre Alpha' }] });
      }
    }

    const component = fixture.componentInstance;
    component.mode = 'conseiller';
    component.openCreate('points');
    component.form.idAlpha = 10;
    component.form.idPeriodeActivite = 1;
    component.form.maitriseSeanceLecture = 'BONNE';
    component.form.maitriseSeanceEcriture = 'MOYENNE';
    component.form.maitriseSeanceCalcul = 'INSUFFISANT';
    component.save();

    const post = http.expectOne('http://api.test/api/visite');
    expect(post.request.method).toBe('POST');
    expect(post.request.body.maitriseSeanceLecture).toBe('BONNE');
    expect(post.request.body.maitriseSeanceEcriture).toBe('MOYENNE');
    expect(post.request.body.maitriseSeanceCalcul).toBe('INSUFFISANT');
    expect(post.request.body.idPeriodeActivite).toBe(1);
    post.flush({ id: 2 });

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/visite')) {
        req.flush([]);
      } else if (req.request.url.endsWith('/api/PeriodeActivites')) {
        req.flush([{ id: 1, code: 'P1', libelle: 'Période test' }]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [] });
      }
    }

    http.verify();
  });

  it('envoie uniquement les champs du suivi IEPP au endpoint suivi-iepp', () => {
    fixture.detectChanges();

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/suivi-iepp')) {
        req.flush([]);
      } else if (req.request.url.endsWith('/api/PeriodeActivites')) {
        req.flush([{ id: 1, code: 'P1', libelle: 'Période test' }]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [{ idCentre: 13, codeAlpha: 'ALP-013', libelleAlpha: 'Centre Alpha 13' }] });
      }
    }

    const component = fixture.componentInstance;
    component.openCreate('suivi');
    component.form.idAlpha = 13;
    component.form.idPeriodeActivite = 1;
    component.form.nombreVisiteEffectueParIepp = 3;
    component.form.nombreReunionPointActiviteAlpha = 3;
    component.form.maitriseSeanceLecture = 'BONNE';
    component.save();

    const post = http.expectOne('http://api.test/api/suivi-iepp');
    expect(post.request.method).toBe('POST');
    expect(post.request.body).toEqual({
      idAlpha: 13,
      idPeriodeActivite: 1,
      nombreVisiteEffectueParIepp: 3,
      nombreReunionPointActiviteAlpha: 3,
    });
    post.flush({ id: 9 });

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/suivi-iepp')) {
        req.flush([]);
      } else if (req.request.url.endsWith('/api/PeriodeActivites')) {
        req.flush([{ id: 1, code: 'P1', libelle: 'Période test' }]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [] });
      }
    }

    http.verify();
  });
});
