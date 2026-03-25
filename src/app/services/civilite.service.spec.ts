import { TestBed } from '@angular/core/testing';

import { CiviliteService } from './civilite.service';

describe('CiviliteService', () => {
  let service: CiviliteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CiviliteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
