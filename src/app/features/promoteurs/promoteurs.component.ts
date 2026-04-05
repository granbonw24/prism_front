import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';

type Promoteur = {
  id: number;
  codePromoteur?: string | null;
  libellePromoteur?: string | null;
};

@Component({
  selector: 'app-promoteurs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promoteurs.component.html',
  styleUrl: './promoteurs.component.css',
})
export class PromoteursComponent {
  loading = false;
  errorMessage: string | null = null;
  rows: Promoteur[] = [];

  detailsRow: Promoteur | null = null;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    this.http.get<Promoteur[]>(`${this.apiBaseUrl}/api/promoteur`).subscribe({
      next: (rows) => {
        this.rows = rows ?? [];
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  openDetails(row: Promoteur): void {
    this.detailsRow = row;
  }

  closeDetails(): void {
    this.detailsRow = null;
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const msg = String((e.error as any)?.message ?? '');
      return msg ? `Erreur serveur: ${e.status} ${e.statusText} — ${msg}` : `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}

