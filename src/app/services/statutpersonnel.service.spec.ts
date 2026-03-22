import { TestBed } from '@angular/core/testing';

import { StatutpersonnelService } from './statutpersonnel.service';

describe('StatutpersonnelService', () => {
  let service: StatutpersonnelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StatutpersonnelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
