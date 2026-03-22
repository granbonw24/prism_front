import { TestBed } from '@angular/core/testing';

import { RegimealphaService } from './regimealpha.service';

describe('RegimealphaService', () => {
  let service: RegimealphaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegimealphaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
