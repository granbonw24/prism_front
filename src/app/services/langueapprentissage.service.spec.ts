import { TestBed } from '@angular/core/testing';

import { LangueapprentissageService } from './langueapprentissage.service';

describe('LangueapprentissageService', () => {
  let service: LangueapprentissageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LangueapprentissageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
