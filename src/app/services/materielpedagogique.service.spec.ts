import { TestBed } from '@angular/core/testing';

import { MaterielpedagogiqueService } from './materielpedagogique.service';

describe('MaterielpedagogiqueService', () => {
  let service: MaterielpedagogiqueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaterielpedagogiqueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
