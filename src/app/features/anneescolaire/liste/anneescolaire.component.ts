import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Anneescolaire } from '@models/anneescolaire';
import { AnneescolaireService } from '@services/anneescolaire.service';
import { AnneescolaireDeleteComponent } from '@features/anneescolaire/delete/delete.component';

@Component({
  selector: 'app-anneescolaire',
  standalone: true,
  imports: [CommonModule, RouterLink, AnneescolaireDeleteComponent],
  templateUrl: './anneescolaire.component.html',
  styleUrl: './anneescolaire.component.css',
})
export class AnneescolaireListeComponent implements OnInit {
  loading = false;
  savingEtatId: number | null = null;
  errorMessage: string | null = null;
  rows: Anneescolaire[] = [];
  deleteTarget: Anneescolaire | null = null;

  constructor(private readonly api: AnneescolaireService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    this.api.findAll().subscribe({
      next: (list) => {
        this.rows = [...(list ?? [])].sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  openDelete(row: Anneescolaire): void {
    this.deleteTarget = row;
  }

  closeDelete(): void {
    this.deleteTarget = null;
  }

  onDeleted(): void {
    this.deleteTarget = null;
    this.reload();
  }

  setCourante(row: Anneescolaire): void {
    const id = row.id;
    if (id == null) return;
    this.savingEtatId = id;
    this.errorMessage = null;
    const payload: Anneescolaire = { ...row, etatAnneeScolaire: true };
    this.api.update(id, payload).subscribe({
      next: () => {
        this.savingEtatId = null;
        this.reload();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.savingEtatId = null;
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
