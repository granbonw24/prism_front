import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AnneescolaireAddComponent } from '@features/anneescolaire/add/add.component';
import { AnneescolaireService } from '@services/anneescolaire.service';

describe('AnneescolaireAddComponent', () => {
  let component: AnneescolaireAddComponent;
  let fixture: ComponentFixture<AnneescolaireAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnneescolaireAddComponent],
      providers: [
        { provide: AnneescolaireService, useValue: { create: () => of({ id: 1 }) } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
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
