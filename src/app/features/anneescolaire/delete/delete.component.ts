import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { Anneescolaire } from '@models/anneescolaire';
import { AnneescolaireService } from '@services/anneescolaire.service';

@Component({
  selector: 'app-anneescolaire-delete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete.component.html',
  styleUrl: './delete.component.css',
})
export class AnneescolaireDeleteComponent {
  @Input({ required: true }) annee!: Anneescolaire;
  @Output() readonly cancelled = new EventEmitter<void>();
  @Output() readonly deleted = new EventEmitter<void>();

  deleting = false;
  errorMessage: string | null = null;

  constructor(private readonly api: AnneescolaireService) {}

  confirm(): void {
    const id = this.annee.id;
    if (id == null) return;
    this.deleting = true;
    this.errorMessage = null;
    this.api.deleteById(id).subscribe({
      next: () => {
        this.deleting = false;
        this.deleted.emit();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.deleting = false;
      },
    });
  }

  cancel(): void {
    if (!this.deleting) {
      this.cancelled.emit();
    }
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
