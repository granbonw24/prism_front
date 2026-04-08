import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { VisitesListComponent } from './visites-list.component';

describe('VisitesListComponent', () => {
  let fixture: ComponentFixture<VisitesListComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitesListComponent, HttpClientTestingModule],
      providers: [
        { provide: API_BASE_URL, useValue: 'http://api.test' },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { title: 'Visites — Test' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VisitesListComponent);
    http = TestBed.inject(HttpTestingController);
  });

  it('charge la liste et les référentiels puis affiche une page Spring pour /api/visites', () => {
    fixture.detectChanges();

    const emptyPage = { content: [], totalElements: 0, totalPages: 0, size: 20, number: 0 };
    const batch = http.match((req) => true);
    expect(batch.length).toBe(4);

    for (const req of batch) {
      const url = req.request.url;
      if (url.includes('/api/visites')) {
        expect(req.request.params.get('page')).toBe('0');
        expect(req.request.params.get('sort')).toBe('id,asc');
        req.flush(emptyPage);
      } else if (url.includes('/api/naturedocument')) {
        req.flush([]);
      } else if (url.includes('/api/v1/TypeDocuments')) {
        req.flush([]);
      } else if (url.includes('/api/v1/alpha')) {
        expect(req.request.params.get('size')).toBe('5000');
        req.flush(emptyPage);
      } else {
        fail(`Requête inattendue : ${url}`);
      }
    }

    http.verify();
    expect(fixture.componentInstance.pageTitle).toBe('Visites — Test');
    expect(fixture.componentInstance.rows.length).toBe(0);
    expect(fixture.componentInstance.errorMessage).toBeNull();
  });
});
