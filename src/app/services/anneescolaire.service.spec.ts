import { TestBed } from '@angular/core/testing';

import { AnneescolaireService } from './anneescolaire.service';

describe('AnneescolaireService', () => {
  let service: AnneescolaireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnneescolaireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
