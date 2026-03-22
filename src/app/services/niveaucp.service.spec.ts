import { TestBed } from '@angular/core/testing';

import { NiveaucpService } from './niveaucp.service';

describe('NiveaucpService', () => {
  let service: NiveaucpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NiveaucpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
