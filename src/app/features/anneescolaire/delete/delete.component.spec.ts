import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AnneescolaireDeleteComponent } from '@features/anneescolaire/delete/delete.component';
import { AnneescolaireService } from '@services/anneescolaire.service';

describe('AnneescolaireDeleteComponent', () => {
  let component: AnneescolaireDeleteComponent;
  let fixture: ComponentFixture<AnneescolaireDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnneescolaireDeleteComponent],
      providers: [{ provide: AnneescolaireService, useValue: { deleteById: () => of(void 0) } }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnneescolaireDeleteComponent);
    component = fixture.componentInstance;
    component.annee = { id: 1, codeAnneeScolaire: 'X', debutAnneeScolaire: '2024-01-01', finAnneeScolaire: '2024-12-31' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
