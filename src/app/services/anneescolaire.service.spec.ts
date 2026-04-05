import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AnneescolaireService } from '@services/anneescolaire.service';

describe('AnneescolaireService', () => {
  let service: AnneescolaireService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://test.local' },
      ],
    });
    service = TestBed.inject(AnneescolaireService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('findAll appelle GET /api/anneescolaire', () => {
    service.findAll().subscribe((rows) => {
      expect(rows.length).toBe(0);
    });
    const req = httpMock.expectOne('http://test.local/api/anneescolaire');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
