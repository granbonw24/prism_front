import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { Anneescolaire } from '@models/anneescolaire';
import { AnneescolaireService } from '@services/anneescolaire.service';

@Component({
  selector: 'app-anneescolaire-add',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add.component.html',
  styleUrl: './add.component.css',
})
export class AnneescolaireAddComponent {
  saving = false;
  errorMessage: string | null = null;

  form: Anneescolaire = {
    debutAnneeScolaire: '',
    finAnneeScolaire: '',
    etatAnneeScolaire: false,
  };

  constructor(
    private readonly api: AnneescolaireService,
    private readonly router: Router,
  ) {}

  submit(): void {
    if (!this.form.debutAnneeScolaire || !this.form.finAnneeScolaire) {
      this.errorMessage = 'Les dates début et fin sont obligatoires.';
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    const payload: Anneescolaire = {
      debutAnneeScolaire: this.form.debutAnneeScolaire,
      finAnneeScolaire: this.form.finAnneeScolaire,
      etatAnneeScolaire: !!this.form.etatAnneeScolaire,
    };
    this.api.create(payload).subscribe({
      next: () => {
        this.saving = false;
        void this.router.navigate(['/anneescolaire']);
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const msg = String((e.error as { message?: string })?.message ?? '');
      return msg
        ? `Erreur serveur: ${e.status} ${e.statusText} — ${msg}`
        : `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}
