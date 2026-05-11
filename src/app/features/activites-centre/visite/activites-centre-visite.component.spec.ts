import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AuthService } from '@services/auth.service';
import { ActivitesCentreVisiteComponent } from './activites-centre-visite.component';

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
    expect(requests.length).toBe(2);
    for (const req of requests) {
      if (req.request.url.endsWith('/api/visite')) {
        req.flush([
          {
            id: 1,
            alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
            nombreVisiteEffectueParIepp: 3,
            nombreReunionPointActiviteAlpha: 2,
          },
        ]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        expect(req.request.params.get('size')).toBe('1000');
        req.flush({ content: [{ idCentre: 10, codeAlpha: 'ALP-001', libelleAlpha: 'Centre Alpha' }] });
      } else {
        fail(`Requête inattendue : ${req.request.url}`);
      }
    }

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

  it('sépare le formulaire points des visites du formulaire suivi', () => {
    fixture.detectChanges();

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/visite')) {
        req.flush([]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [{ idCentre: 10, codeAlpha: 'ALP-001', libelleAlpha: 'Centre Alpha' }] });
      }
    }

    const component = fixture.componentInstance;
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

  it('ouvre Ajouter suivi en modification quand une seule ligne existante est ciblée', () => {
    fixture.detectChanges();

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/visite')) {
        req.flush([
          {
            id: 7,
            alpha: { id: 10, code: 'ALP-001', libelle: 'Centre Alpha' },
            nombreVisiteEffectueParIepp: 3,
          },
        ]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [{ idCentre: 10, codeAlpha: 'ALP-001', libelleAlpha: 'Centre Alpha' }] });
      }
    }

    const component = fixture.componentInstance;
    component.openCreate('suivi');

    expect(component.editTarget?.id).toBe(7);
    expect(component.formMode).toBe('suivi');
    expect(component.formTitle).toBe('Modifier le suivi de visite');
    http.verify();
  });

  it('envoie les évaluations de maîtrise au backend sous forme BONNE/MOYENNE/MAUVAISE', () => {
    fixture.detectChanges();

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/visite')) {
        req.flush([]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [{ idCentre: 10, codeAlpha: 'ALP-001', libelleAlpha: 'Centre Alpha' }] });
      }
    }

    const component = fixture.componentInstance;
    component.openCreate('points');
    component.form.idAlpha = 10;
    component.form.maitriseSeanceLecture = 'BONNE';
    component.form.maitriseSeanceEcriture = 'MOYENNE';
    component.form.maitriseSeanceCalcul = 'MAUVAISE';
    component.save();

    const post = http.expectOne('http://api.test/api/visite');
    expect(post.request.method).toBe('POST');
    expect(post.request.body.maitriseSeanceLecture).toBe('BONNE');
    expect(post.request.body.maitriseSeanceEcriture).toBe('MOYENNE');
    expect(post.request.body.maitriseSeanceCalcul).toBe('MAUVAISE');
    post.flush({ id: 2 });

    for (const req of http.match(() => true)) {
      if (req.request.url.endsWith('/api/visite')) {
        req.flush([]);
      } else if (req.request.url.endsWith('/api/alpha')) {
        req.flush({ content: [] });
      }
    }

    http.verify();
  });
});
