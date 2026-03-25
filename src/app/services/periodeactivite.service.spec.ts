import { TestBed } from '@angular/core/testing';

import { PeriodeactiviteService } from './periodeactivite.service';

describe('PeriodeactiviteService', () => {
  let service: PeriodeactiviteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeriodeactiviteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
