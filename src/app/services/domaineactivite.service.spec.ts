import { TestBed } from '@angular/core/testing';

import { DomaineactiviteService } from './domaineactivite.service';

describe('DomaineactiviteService', () => {
  let service: DomaineactiviteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DomaineactiviteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
