import { TestBed } from '@angular/core/testing';

import { SupportdidactiqueService } from './supportdidactique.service';

describe('SupportdidactiqueService', () => {
  let service: SupportdidactiqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupportdidactiqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
