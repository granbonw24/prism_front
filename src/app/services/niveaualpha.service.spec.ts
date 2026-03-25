import { TestBed } from '@angular/core/testing';

import { NiveaualphaService } from './niveaualpha.service';

describe('NiveaualphaService', () => {
  let service: NiveaualphaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NiveaualphaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
