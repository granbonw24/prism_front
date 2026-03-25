import { TestBed } from '@angular/core/testing';

import { ModealphaService } from './modealpha.service';

describe('ModealphaService', () => {
  let service: ModealphaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModealphaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
