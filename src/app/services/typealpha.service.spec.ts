import { TestBed } from '@angular/core/testing';

import { TypealphaService } from './typealpha.service';

describe('TypealphaService', () => {
  let service: TypealphaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypealphaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
