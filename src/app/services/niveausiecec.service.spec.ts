import { TestBed } from '@angular/core/testing';

import { NiveausiececService } from './niveausiecec.service';

describe('NiveausiececService', () => {
  let service: NiveausiececService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NiveausiececService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
