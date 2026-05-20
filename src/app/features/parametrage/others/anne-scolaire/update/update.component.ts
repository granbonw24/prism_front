import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { canViewMenuFeature } from '@core/rbac/menu-rbac.util';
import type { Anneescolaire } from '@models/anneescolaire';
import { AnneescolaireService } from '@services/anneescolaire.service';
import { AuthService } from '@services/auth.service';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';

@Component({
  selector: 'app-anneescolaire-update',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MenaLoadingComponent],
  templateUrl: './update.component.html',
  styleUrl: './update.component.css',
})
export class AnneescolaireUpdateComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  form: Anneescolaire = {};
  private id: number | null = null;

  constructor(
    private readonly api: AnneescolaireService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    if (!canViewMenuFeature(this.auth, MENU_FEATURES.PARAMETRAGE_AUTRES, 'MODIFIER')) {
      void this.router.navigate(['/anneescolaire'], { queryParams: { accessDenied: '1' } });
      return;
    }
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw != null ? Number(raw) : NaN;
    if (!Number.isFinite(id)) {
      void this.router.navigate(['/anneescolaire']);
      return;
    }
    this.id = id;
    this.loading = true;
    this.api.findById(id).subscribe({
      next: (row) => {
        this.form = {
          ...row,
          debutAnneeScolaire: this.toDateInput(row.debutAnneeScolaire),
          finAnneeScolaire: this.toDateInput(row.finAnneeScolaire),
        };
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (this.id == null) return;
    if (!this.form.debutAnneeScolaire || !this.form.finAnneeScolaire) {
      this.errorMessage = 'Les dates début et fin sont obligatoires.';
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    const payload: Anneescolaire = {
      ...this.form,
      id: this.id,
      debutAnneeScolaire: this.form.debutAnneeScolaire,
      finAnneeScolaire: this.form.finAnneeScolaire,
      etatAnneeScolaire: !!this.form.etatAnneeScolaire,
    };
    this.api.update(this.id, payload).subscribe({
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

  private toDateInput(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    return value.length >= 10 ? value.slice(0, 10) : value;
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
