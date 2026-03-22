import { TestBed } from '@angular/core/testing';

import { CategorieappuiService } from './categorieappui.service';

describe('CategorieappuiService', () => {
  let service: CategorieappuiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategorieappuiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
