import { TestBed } from '@angular/core/testing';

import { AutoriteautorisationService } from './autoriteautorisation.service';

describe('AutoriteautorisationService', () => {
  let service: AutoriteautorisationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AutoriteautorisationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
