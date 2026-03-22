import { TestBed } from '@angular/core/testing';

import { PeriodiciteService } from './periodicite.service';

describe('PeriodiciteService', () => {
  let service: PeriodiciteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeriodiciteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
