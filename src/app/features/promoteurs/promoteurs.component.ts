import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { FormsModule } from '@angular/forms';
import { SpringPage } from '@models/centre';

type Promoteur = {
  id: number;
  codePromoteur?: string | null;
  libellePromoteur?: string | null;
};

@Component({
  selector: 'app-promoteurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promoteurs.component.html',
  styleUrl: './promoteurs.component.css',
})
export class PromoteursComponent {
  loading = false;
  errorMessage: string | null = null;
  rows: Promoteur[] = [];

  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

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
    const params = new HttpParams()
      .set('page', String(this.pageIndex))
      .set('size', String(this.pageSize))
      .set('sort', 'id,asc');
    this.http
      .get<SpringPage<Promoteur>>(`${this.apiBaseUrl}/api/promoteur/paged`, { params })
      .subscribe({
        next: (page) => {
          this.rows = page.content ?? [];
          this.totalPages = page.totalPages ?? 0;
          this.totalElements = page.totalElements ?? 0;
          this.loading = false;
        },
        error: (e) => {
          this.errorMessage = this.formatError(e);
          this.loading = false;
        },
      });
  }

  goPrevPage(): void {
    if (this.pageIndex <= 0 || this.loading) return;
    this.pageIndex--;
    this.reload();
  }

  goNextPage(): void {
    const tp = this.totalPages;
    if (tp <= 0 || this.pageIndex >= tp - 1 || this.loading) return;
    this.pageIndex++;
    this.reload();
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.reload();
  }

  canGoPrevPage(): boolean {
    return this.pageIndex > 0 && !this.loading;
  }

  canGoNextPage(): boolean {
    const tp = this.totalPages;
    if (tp <= 0) return false;
    return this.pageIndex < tp - 1 && !this.loading;
  }

  get displayTotalPages(): number {
    return this.totalPages > 0 ? this.totalPages : 1;
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

