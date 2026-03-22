import { TestBed } from '@angular/core/testing';

import { ImpactService } from './impact.service';

describe('ImpactService', () => {
  let service: ImpactService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImpactService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
