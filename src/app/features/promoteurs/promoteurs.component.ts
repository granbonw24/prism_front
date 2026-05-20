import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { FormsModule } from '@angular/forms';
import { SpringPage } from '@models/centre';
import { promoteurDetailsFromApi } from '@models/centre';
import { MenaToolbarButtonComponent } from '@shared/mena-toolbar-button/mena-toolbar-button.component';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { MenaContextDashboardComponent } from '@shared/mena-context-dashboard/mena-context-dashboard.component';
import {
  MenaRecordDetailField,
  MenaRecordDetailModalComponent,
} from '@shared/mena-record-detail-modal/mena-record-detail-modal.component';
import { toMenaSelectOptionsFromPairs } from '@shared/mena-searchable-select/mena-select-options.util';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';

type Promoteur = {
  id: number;
  codePromoteur?: string | null;
  libellePromoteur?: string | null;
  typePromoteur?: string | null;
  personnePhysique?: Record<string, unknown> | null;
  personneMorale?: Record<string, unknown> | null;
};

@Component({
  selector: 'app-promoteurs',
  standalone: true,
  imports: [
    MenaLoadingComponent,
    CommonModule,
    FormsModule,
    MenaToolbarButtonComponent,
    MenaContextDashboardComponent,
    MenaRecordDetailModalComponent,
    MenaSearchableSelectComponent,
  ],
  templateUrl: './promoteurs.component.html',
  styleUrl: './promoteurs.component.css',
})
export class PromoteursComponent implements OnInit {
  loading = false;
  detailLoading = false;
  errorMessage: string | null = null;
  rows: Promoteur[] = [];

  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  listFilter = {
    q: '',
    typePromoteur: '',
    codePromoteur: '',
    libellePromoteur: '',
  };

  detailModalOpen = false;
  detailFields: MenaRecordDetailField[] = [];
  detailSubtitle = '';

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  menaTypePromoteurOptions() {
    return toMenaSelectOptionsFromPairs([
      { value: '', label: 'Tous les types' },
      { value: 'PHYSIQUE', label: 'Personne physique' },
      { value: 'MORALE', label: 'Personne morale' },
    ]);
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    let params = new HttpParams()
      .set('page', String(this.pageIndex))
      .set('size', String(this.pageSize))
      .set('sort', 'id,asc');
    const q = this.listFilter.q.trim();
    if (q) params = params.set('q', q);
    if (this.listFilter.typePromoteur.trim()) {
      params = params.set('typePromoteur', this.listFilter.typePromoteur.trim());
    }
    if (this.listFilter.codePromoteur.trim()) {
      params = params.set('codePromoteur', this.listFilter.codePromoteur.trim());
    }
    if (this.listFilter.libellePromoteur.trim()) {
      params = params.set('libellePromoteur', this.listFilter.libellePromoteur.trim());
    }
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

  applyListFilters(): void {
    this.pageIndex = 0;
    this.reload();
  }

  resetListFilters(): void {
    this.listFilter = { q: '', typePromoteur: '', codePromoteur: '', libellePromoteur: '' };
    this.pageIndex = 0;
    this.reload();
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
    this.detailModalOpen = true;
    this.detailLoading = true;
    this.detailFields = [];
    this.detailSubtitle = row.libellePromoteur?.trim() || row.codePromoteur?.trim() || `#${row.id}`;
    this.http.get<Record<string, unknown>>(`${this.apiBaseUrl}/api/promoteur/${row.id}`).subscribe({
      next: (body) => {
        this.detailFields = this.buildDetailFields(body);
        this.detailSubtitle =
          (body['libellePromoteur'] as string | undefined)?.trim() ||
          (body['codePromoteur'] as string | undefined)?.trim() ||
          this.detailSubtitle;
        this.detailLoading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.detailLoading = false;
        this.closeDetails();
      },
    });
  }

  closeDetails(): void {
    this.detailModalOpen = false;
    this.detailFields = [];
    this.detailSubtitle = '';
    this.detailLoading = false;
  }

  private buildDetailFields(body: Record<string, unknown>): MenaRecordDetailField[] {
    const details = promoteurDetailsFromApi(body);
    const fields: MenaRecordDetailField[] = [
      { label: 'ID', value: String(body['id'] ?? '—') },
      { label: 'Code', value: (body['codePromoteur'] as string | undefined)?.trim() || '—' },
      { label: 'Libellé', value: (body['libellePromoteur'] as string | undefined)?.trim() || '—' },
      { label: 'Type', value: (body['typePromoteur'] as string | undefined)?.trim() || '—' },
    ];
    const pp = (body['personnePhysique'] ?? details?.personnePhysique) as Record<string, unknown> | null | undefined;
    if (pp) {
      fields.push(
        { label: 'Civilité', value: this.str(pp['civilite']) },
        { label: 'Nom', value: this.str(pp['nom']) },
        { label: 'Prénom', value: this.str(pp['prenom']) },
        { label: 'Contact', value: this.str(pp['contact']) },
        { label: 'Sexe', value: this.str(pp['sexe']) },
        { label: 'Date de naissance', value: this.str(pp['dateNaissance']) },
        { label: 'Ancienneté', value: this.str(pp['anciennete']) },
        { label: "Niveau d'études", value: this.str(pp['niveauEtudes']) },
        { label: 'Fonction', value: this.str(pp['fonction']) },
        { label: 'Boîte postale', value: this.str(pp['boitePostale']) },
      );
    }
    const pm = (body['personneMorale'] ?? details?.personneMorale) as Record<string, unknown> | null | undefined;
    if (pm) {
      fields.push(
        { label: 'Dénomination', value: this.str(pm['denomination']) },
        { label: 'Programme', value: this.str(pm['nomProgramme']) },
        { label: 'Représentant légal', value: this.str(pm['nomRepresentant'] ?? pm['nomRepresentantLegalStructure']) },
        { label: 'Type personne morale', value: this.str(pm['libelleTypePersonneMorale']) },
        { label: 'Contact', value: this.str(pm['contact']) },
        { label: 'Boîte postale', value: this.str(pm['boitePostale']) },
        { label: 'E-mail', value: this.str(pm['mail']) },
      );
    }
    return fields;
  }

  private str(v: unknown): string {
    const s = v == null ? '' : String(v).trim();
    return s || '—';
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const msg = String((e.error as any)?.message ?? '');
      return msg ? `Erreur serveur: ${e.status} ${e.statusText} — ${msg}` : `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}
