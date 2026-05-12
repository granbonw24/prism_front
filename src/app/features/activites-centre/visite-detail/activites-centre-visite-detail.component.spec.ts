import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { ActivitesCentreVisiteDetailComponent } from './activites-centre-visite-detail.component';

describe('ActivitesCentreVisiteDetailComponent', () => {
  let fixture: ComponentFixture<ActivitesCentreVisiteDetailComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivitesCentreVisiteDetailComponent, HttpClientTestingModule],
      providers: [
        { provide: API_BASE_URL, useValue: 'http://api.test' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '2' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitesCentreVisiteDetailComponent);
    http = TestBed.inject(HttpTestingController);
  });

  it('affiche uniquement les points de visite et le suivi conseiller', () => {
    fixture.detectChanges();

    const req = http.expectOne('http://api.test/api/visite/2');
    req.flush({
      id: 2,
      alpha: { id: 13, code: 'ALP000003', libelle: 'Alpha Full Morale' },
      maitriseSeanceLecture: 'BONNE',
      maitriseSeanceEcriture: 'MOYENNE',
      maitriseSeanceCalcul: 'MAUVAISE',
      maitriseSeanceCvc: 'BONNE',
      nombreVisiteRealiseParConseiller: 1,
      nombreBulletinEffectueParConseiller: 1,
      nombreVisiteConseillerSuperviseurEffectue: 5,
      nombreReunionBilanConseillerSuperviseur: 10,
      nombreVisiteEffectueParIepp: 7,
      nombreReunionPointActiviteAlpha: 8,
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Points des visites');
    expect(text).toContain('Suivi du conseiller');
    expect(text).not.toContain('Suivi par le superviseur');
    expect(text).not.toContain('Suivi par l’IEPP');
  });
});
