import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
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
import { MenaRowActionButtonComponent } from '@shared/mena-row-action-button/mena-row-action-button.component';

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
    MenaRowActionButtonComponent,
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

  typeLabel(type: string | null | undefined): string {
    const t = (type ?? '').trim().toUpperCase();
    if (t === 'PHYSIQUE') return 'Personne physique';
    if (t === 'MORALE') return 'Personne morale';
    return type?.trim() || '—';
  }

  identityLabel(row: Promoteur): string {
    const pp = row.personnePhysique;
    if (pp) {
      const parts = [this.raw(pp['civilite']), this.raw(pp['nom']), this.raw(pp['prenom'])].filter(Boolean);
      if (parts.length) return parts.join(' ');
      return this.raw(pp['libellePersonnePhysique']) || '—';
    }
    const pm = row.personneMorale;
    if (pm) {
      return this.raw(pm['denomination']) || this.raw(pm['nomProgramme']) || '—';
    }
    return '—';
  }

  contactLabel(row: Promoteur): string {
    return (
      this.raw(row.personnePhysique?.['contact']) ||
      this.raw(row.personneMorale?.['contact']) ||
      '—'
    );
  }

  mailLabel(row: Promoteur): string {
    return this.raw(row.personnePhysique?.['mail']) || this.raw(row.personneMorale?.['mail']) || '—';
  }

  complementLabel(row: Promoteur): string {
    const pp = row.personnePhysique;
    if (pp) {
      const parts: string[] = [];
      const dn = this.raw(pp['dateNaissance']);
      if (dn) parts.push(`Né(e) le ${dn}`);
      const org = this.raw(pp['organisationFaitiere']);
      if (org) parts.push(org);
      const fn = this.raw(pp['fonction']);
      if (fn) parts.push(fn);
      return parts.join(' · ') || '—';
    }
    const pm = row.personneMorale;
    if (pm) {
      const parts: string[] = [];
      const typePm = this.raw(pm['libelleTypePersonneMorale']);
      if (typePm) parts.push(typePm);
      const rep = this.raw(pm['nomRepresentant'] ?? pm['nomRepresentantLegalStructure']);
      if (rep) parts.push(`Représ. ${rep}`);
      const prog = this.raw(pm['nomProgramme']);
      if (prog) parts.push(prog);
      return parts.join(' · ') || '—';
    }
    return '—';
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
    const type = (body['typePromoteur'] as string | undefined) ?? details?.typePromoteur ?? null;
    const fields: MenaRecordDetailField[] = [
      { label: 'Identification', value: '', section: true },
      { label: 'Code promoteur', value: this.str(body['codePromoteur']) },
      { label: 'Libellé', value: this.str(body['libellePromoteur']) },
      { label: 'Type', value: this.typeLabel(type) },
    ];

    const pp = (body['personnePhysique'] ?? details?.personnePhysique) as Record<string, unknown> | null | undefined;
    if (pp) {
      fields.push(
        { label: 'Personne physique', value: '', section: true },
        { label: 'Civilité', value: this.str(pp['civilite']) },
        { label: 'Nom', value: this.str(pp['nom']) },
        { label: 'Prénom', value: this.str(pp['prenom']) },
        { label: 'Libellé personne physique', value: this.str(pp['libellePersonnePhysique']) },
        { label: 'Sexe', value: this.str(pp['sexe']) },
        { label: 'Date de naissance', value: this.str(pp['dateNaissance']) },
        { label: 'Contact', value: this.str(pp['contact']) },
        { label: 'E-mail', value: this.str(pp['mail']) },
        { label: 'Boîte postale', value: this.str(pp['boitePostale']) },
        { label: 'Fonction', value: this.str(pp['fonction']) },
        { label: "Niveau d'études", value: this.str(pp['niveauEtudes']) },
        { label: 'Organisation faîtière', value: this.str(pp['organisationFaitiere']) },
      );
    }

    const pm = (body['personneMorale'] ?? details?.personneMorale) as Record<string, unknown> | null | undefined;
    if (pm) {
      fields.push(
        { label: 'Personne morale', value: '', section: true },
        { label: 'Dénomination', value: this.str(pm['denomination']) },
        { label: 'Type de personne morale', value: this.str(pm['libelleTypePersonneMorale']) },
        { label: 'Nom du programme', value: this.str(pm['nomProgramme']) },
        {
          label: 'Représentant légal',
          value: this.str(pm['nomRepresentant'] ?? pm['nomRepresentantLegalStructure']),
        },
        { label: 'Contact', value: this.str(pm['contact']) },
        { label: 'E-mail', value: this.str(pm['mail']) },
        { label: 'Boîte postale', value: this.str(pm['boitePostale']) },
      );
    }

    if (!pp && !pm) {
      fields.push({
        label: 'Complément',
        value: 'Aucune fiche personne physique / morale associée.',
      });
    }

    return fields;
  }

  private raw(v: unknown): string {
    return v == null ? '' : String(v).trim();
  }

  private str(v: unknown): string {
    return this.raw(v) || '—';
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const msg = String((e.error as any)?.message ?? '');
      return msg ? `Erreur serveur: ${e.status} ${e.statusText} — ${msg}` : `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}
