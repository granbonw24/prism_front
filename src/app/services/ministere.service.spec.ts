import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { MinistereService } from '@services/ministere.service';

describe('MinistereService', () => {
  let service: MinistereService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: API_BASE_URL, useValue: 'http://test.local' },
      ],
    });
    service = TestBed.inject(MinistereService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
