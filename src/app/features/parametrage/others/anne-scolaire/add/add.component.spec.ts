import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AnneescolaireAddComponent } from '@features/parametrage/others/anne-scolaire/add/add.component';
import { AnneescolaireService } from '@services/anneescolaire.service';

describe('AnneescolaireAddComponent', () => {
  let component: AnneescolaireAddComponent;
  let fixture: ComponentFixture<AnneescolaireAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, AnneescolaireAddComponent],
      providers: [
        { provide: AnneescolaireService, useValue: { create: () => of({ id: 1 }) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AnneescolaireAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
