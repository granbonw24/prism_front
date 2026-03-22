import { TestBed } from '@angular/core/testing';

import { NaturedocumentService } from './naturedocument.service';

describe('NaturedocumentService', () => {
  let service: NaturedocumentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NaturedocumentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
