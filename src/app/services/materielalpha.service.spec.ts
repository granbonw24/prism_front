import { TestBed } from '@angular/core/testing';

import { MaterielalphaService } from './materielalpha.service';

describe('MaterielalphaService', () => {
  let service: MaterielalphaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaterielalphaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
