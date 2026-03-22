import { TestBed } from '@angular/core/testing';

import { NaturecentreService } from './naturecentre.service';

describe('NaturecentreService', () => {
  let service: NaturecentreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NaturecentreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
