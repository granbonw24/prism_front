import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AnneescolaireUpdateComponent } from '@features/parametrage/others/anne-scolaire/update/update.component';
import { AnneescolaireService } from '@services/anneescolaire.service';

describe('AnneescolaireUpdateComponent', () => {
  let component: AnneescolaireUpdateComponent;
  let fixture: ComponentFixture<AnneescolaireUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AnneescolaireUpdateComponent],
      providers: [
        {
          provide: AnneescolaireService,
          useValue: {
            findById: () =>
              of({ id: 1, codeAnneeScolaire: 'AS1', debutAnneeScolaire: '2024-09-01', finAnneeScolaire: '2025-06-30' }),
            update: () => of({ id: 1 }),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? '1' : null) } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnneescolaireUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
