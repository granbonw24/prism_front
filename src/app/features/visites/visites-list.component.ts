import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { SpringPage, VisiteDocumentRow } from '@models/centre';
import { MenaRowActionButtonComponent } from '@shared/mena-row-action-button/mena-row-action-button.component';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import {
  MenaSelectOption,
  sortByLabel,
  toMenaSelectOptions,
} from '@shared/mena-searchable-select/mena-select-options.util';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { MenaToolbarButtonComponent } from '@shared/mena-toolbar-button/mena-toolbar-button.component';

/**
 * Référentiels nature / type : l’API renvoie le format B (`{ id, libelle }`, `{ id, code, libelle }`),
 * pas les noms de propriétés entité JPA.
 */
type NatureDoc = { id: number; libelleNatureDocument: string };
type TypeDoc = {
  id: number;
  codeTypeDocument: string | null;
  libelleTypeDocument: string | null;
};
type AlphaListRow = { idCentre: number; codeCentre?: string | null; libelle?: string | null; codeType?: string | null };
type DocumentUpsertPayload = {
  idNatureDocument: number | null;
  idTypeDocument: number | null;
  idCentre: number | null;
  codeDocument?: string | null;
  existe?: string | null;
  ajour?: string | null;
  bientenu?: string | null;
  respmethode?: string | null;
  bienrensigne?: string | null;
};

@Component({
  selector: 'app-visites-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MenaRowActionButtonComponent,
    MenaSearchableSelectComponent,
    MenaToolbarButtonComponent,
    MenaLoadingComponent,
  ],
  templateUrl: './visites-list.component.html',
  styleUrl: './visites-list.component.css',
})
export class VisitesListComponent implements OnInit {
  pageTitle = 'Visites';

  loading = false;
  saving = false;
  errorMessage: string | null = null;
  rows: VisiteDocumentRow[] = [];

  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  searchQ = '';
  filterIdCentre: number | '' = '';
  filterIdNatureDocument: number | '' = '';
  filterIdTypeDocument: number | '' = '';

  natures: NatureDoc[] = [];
  types: TypeDoc[] = [];
  alphas: AlphaListRow[] = [];

  private refsLoaded = false;

  createOpen = false;
  editId: number | null = null;
  /** Ligne ouverte en édition (aperçu libellé document). */
  editSourceRow: VisiteDocumentRow | null = null;
  deleteTarget: VisiteDocumentRow | null = null;

  createForm: DocumentUpsertPayload = this.emptyUpsertForm();
  editForm: DocumentUpsertPayload = this.emptyUpsertForm();

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const t = this.route.snapshot.data['title'];
    if (typeof t === 'string' && t.trim()) {
      this.pageTitle = t.trim();
    }
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    const list$ = this.http.get<SpringPage<VisiteDocumentRow>>(`${this.apiBaseUrl}/api/visites`, {
      params: this.buildListParams(),
    });
    if (this.refsLoaded) {
      list$.subscribe({
        next: (page) => this.applyPage(page),
        error: (e) => this.onError(e),
      });
      return;
    }
    forkJoin({
      list: list$,
      natures: this.http.get<NatureDoc[]>(`${this.apiBaseUrl}/api/naturedocument`),
      types: this.http.get<TypeDoc[]>(`${this.apiBaseUrl}/api/TypeDocuments`),
      alphas: this.http.get<SpringPage<AlphaListRow>>(`${this.apiBaseUrl}/api/alpha`, {
        params: new HttpParams().set('page', '0').set('size', '500').set('sort', 'id,asc'),
      }),
    }).subscribe({
      next: (res) => {
        this.natures = sortByLabel(this.normalizeNatureDocs(res.natures), (n) => this.natureOptionLabel(n));
        this.types = sortByLabel(this.normalizeTypeDocs(res.types), (t) => this.typeOptionLabel(t));
        this.alphas = sortByLabel(res.alphas.content ?? [], (a) => this.alphaOptionLabel(a));
        this.refsLoaded = true;
        this.applyPage(res.list);
        this.loading = false;
      },
      error: (e) => this.onError(e),
    });
  }

  private applyPage(page: SpringPage<VisiteDocumentRow>): void {
    this.rows = page.content ?? [];
    this.totalPages = page.totalPages ?? 0;
    this.totalElements = page.totalElements ?? 0;
    this.loading = false;
  }

  private onError(e: unknown): void {
    this.errorMessage = this.formatError(e);
    this.loading = false;
    this.rows = [];
    this.totalPages = 0;
    this.totalElements = 0;
  }

  private buildListParams(): HttpParams {
    let p = new HttpParams()
      .set('page', String(this.pageIndex))
      .set('size', String(this.pageSize))
      .set('sort', 'id,asc');
    const q = this.searchQ.trim();
    if (q) {
      p = p.set('q', q);
    }
    if (this.filterIdCentre !== '' && this.filterIdCentre != null) {
      p = p.set('idCentre', String(this.filterIdCentre));
    }
    if (this.filterIdNatureDocument !== '' && this.filterIdNatureDocument != null) {
      p = p.set('idNatureDocument', String(this.filterIdNatureDocument));
    }
    if (this.filterIdTypeDocument !== '' && this.filterIdTypeDocument != null) {
      p = p.set('idTypeDocument', String(this.filterIdTypeDocument));
    }
    return p;
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.reload();
  }

  clearFilters(): void {
    this.searchQ = '';
    this.filterIdCentre = '';
    this.filterIdNatureDocument = '';
    this.filterIdTypeDocument = '';
    this.pageIndex = 0;
    this.reload();
  }

  openCreate(): void {
    this.errorMessage = null;
    this.createForm = this.emptyUpsertForm();
    // Pré-remplit centre/nature/type si filtres activés
    if (this.filterIdCentre !== '') this.createForm.idCentre = Number(this.filterIdCentre);
    if (this.filterIdNatureDocument !== '') this.createForm.idNatureDocument = Number(this.filterIdNatureDocument);
    if (this.filterIdTypeDocument !== '') this.createForm.idTypeDocument = Number(this.filterIdTypeDocument);
    this.createOpen = true;
  }

  closeCreate(): void {
    if (this.saving) return;
    this.createOpen = false;
  }

  create(): void {
    if (this.saving) return;
    const p = this.normalizePayload(this.createForm);
    if (!p.idCentre || !p.idNatureDocument || !p.idTypeDocument) {
      this.errorMessage = 'Centre Alpha, nature et type de document sont obligatoires.';
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    this.http.post<any>(`${this.apiBaseUrl}/api/documents`, p).subscribe({
      next: () => {
        this.saving = false;
        this.createOpen = false;
        this.reload();
      },
      error: (e) => {
        this.saving = false;
        this.errorMessage = this.formatError(e);
      },
    });
  }

  openEdit(row: VisiteDocumentRow): void {
    this.errorMessage = null;
    this.editSourceRow = row;
    this.editId = row.id ?? null;
    this.editForm = this.normalizePayload({
      idCentre: this.coerceId(row.idCentreAlpha),
      idNatureDocument: this.coerceId(row.idNatureDocument),
      idTypeDocument: this.coerceId(row.idTypeDocument),
      codeDocument: row.codeDocument ?? null,
      existe: row.existe ?? null,
      ajour: row.ajour ?? null,
      bientenu: row.bientenu ?? null,
      respmethode: row.respmethode ?? null,
      bienrensigne: row.bienrensigne ?? null,
    });
  }

  closeEdit(): void {
    if (this.saving) return;
    this.editId = null;
    this.editSourceRow = null;
  }

  saveEdit(): void {
    if (this.saving || this.editId == null) return;
    const p = this.normalizePayload(this.editForm);
    if (!p.idCentre || !p.idNatureDocument || !p.idTypeDocument) {
      this.errorMessage = 'Centre Alpha, nature et type de document sont obligatoires.';
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    this.http.put<any>(`${this.apiBaseUrl}/api/documents/${encodeURIComponent(String(this.editId))}`, p).subscribe({
      next: () => {
        this.saving = false;
        this.editId = null;
        this.reload();
      },
      error: (e) => {
        this.saving = false;
        this.errorMessage = this.formatError(e);
      },
    });
  }

  confirmDelete(row: VisiteDocumentRow): void {
    this.errorMessage = null;
    this.deleteTarget = row;
  }

  closeDelete(): void {
    if (this.saving) return;
    this.deleteTarget = null;
  }

  deleteConfirmed(): void {
    const row = this.deleteTarget;
    if (this.saving || !row?.id) return;
    this.saving = true;
    this.errorMessage = null;
    this.http.delete<void>(`${this.apiBaseUrl}/api/documents/${encodeURIComponent(String(row.id))}`).subscribe({
      next: () => {
        this.saving = false;
        this.deleteTarget = null;
        this.reload();
      },
      error: (e) => {
        this.saving = false;
        this.errorMessage = this.formatError(e);
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

  alphaOptionLabel(a: AlphaListRow): string {
    const lib = (a.libelle ?? '').trim();
    return lib || `Alpha #${a.idCentre}`;
  }

  /** Libellé lisible pour la fiche (priorité type + nature ; le code reste en secours). */
  documentDisplayLabel(row: VisiteDocumentRow): string {
    const typeL = (row.libelleTypeDocument ?? '').trim();
    const natL = (row.libelleNatureDocument ?? '').trim();
    if (typeL && natL) return `${typeL} — ${natL}`;
    if (typeL) return typeL;
    if (natL) return natL;
    const code = (row.codeDocument ?? '').trim();
    return code || '—';
  }

  /** Aperçu dans le modal édition à partir des listes + formulaire. */
  get editDocumentPreview(): string {
    const n = this.natures.find((x) => Number(x.id) === Number(this.editForm.idNatureDocument));
    const t = this.types.find((x) => Number(x.id) === Number(this.editForm.idTypeDocument));
    const typeL = (t?.libelleTypeDocument ?? '').trim() || (t?.codeTypeDocument ?? '').trim();
    const natL = (n?.libelleNatureDocument ?? '').trim();
    if (typeL && natL) return `${typeL} — ${natL}`;
    if (typeL) return typeL;
    if (natL) return natL;
    return this.editSourceRow ? this.documentDisplayLabel(this.editSourceRow) : '—';
  }

  natureOptionLabel(n: NatureDoc): string {
    return (n.libelleNatureDocument ?? '').trim() || `Nature #${n.id}`;
  }

  typeOptionLabel(t: TypeDoc): string {
    return (t.libelleTypeDocument ?? '').trim() || `Type #${t.id}`;
  }

  menaAlphaFilterOptions(): MenaSelectOption<number | ''>[] {
    return [
      { value: '', label: 'Tous' },
      ...toMenaSelectOptions(this.alphas, (a) => a.idCentre, (a) => this.alphaOptionLabel(a)),
    ];
  }

  menaNatureFilterOptions(): MenaSelectOption<number | ''>[] {
    return [
      { value: '', label: 'Toutes' },
      ...toMenaSelectOptions(this.natures, (n) => n.id, (n) => this.natureOptionLabel(n)),
    ];
  }

  menaTypeFilterOptions(): MenaSelectOption<number | ''>[] {
    return [
      { value: '', label: 'Tous' },
      ...toMenaSelectOptions(this.types, (t) => t.id, (t) => this.typeOptionLabel(t)),
    ];
  }

  menaAlphaFormOptions(): MenaSelectOption<number | null>[] {
    return toMenaSelectOptions(this.alphas, (a) => a.idCentre, (a) => this.alphaOptionLabel(a));
  }

  menaNatureFormOptions(): MenaSelectOption<number | null>[] {
    return toMenaSelectOptions(this.natures, (n) => n.id, (n) => this.natureOptionLabel(n));
  }

  menaTypeFormOptions(): MenaSelectOption<number | null>[] {
    return toMenaSelectOptions(this.types, (t) => t.id, (t) => this.typeOptionLabel(t));
  }

  private coerceId(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  }

  private normalizeNatureDocs(body: unknown): NatureDoc[] {
    const list = unwrapListBody(body);
    return list
      .map((raw) => {
        const r = raw as Record<string, unknown>;
        const idRaw = r['id'];
        const id = typeof idRaw === 'number' ? idRaw : Number(idRaw);
        if (!Number.isFinite(id)) return null;
        const lib =
          (typeof r['libelleNatureDocument'] === 'string' ? r['libelleNatureDocument'] : null) ??
          (typeof r['libelle'] === 'string' ? r['libelle'] : null) ??
          '—';
        return { id, libelleNatureDocument: lib };
      })
      .filter((x): x is NatureDoc => x != null);
  }

  private normalizeTypeDocs(body: unknown): TypeDoc[] {
    const list = unwrapListBody(body);
    return list
      .map((raw) => {
        const r = raw as Record<string, unknown>;
        const idRaw = r['id'];
        const id = typeof idRaw === 'number' ? idRaw : Number(idRaw);
        if (!Number.isFinite(id)) return null;
        const code =
          (typeof r['codeTypeDocument'] === 'string' ? r['codeTypeDocument'] : null) ??
          (typeof r['code'] === 'string' ? r['code'] : null) ??
          null;
        const lib =
          (typeof r['libelleTypeDocument'] === 'string' ? r['libelleTypeDocument'] : null) ??
          (typeof r['libelle'] === 'string' ? r['libelle'] : null) ??
          null;
        return { id, codeTypeDocument: code, libelleTypeDocument: lib };
      })
      .filter((x): x is TypeDoc => x != null);
  }

  private emptyUpsertForm(): DocumentUpsertPayload {
    return {
      idNatureDocument: null,
      idTypeDocument: null,
      idCentre: null,
      codeDocument: null,
      existe: 'OUI',
      ajour: 'OUI',
      bientenu: 'OUI',
      respmethode: 'OUI',
      bienrensigne: 'OUI',
    };
  }

  private normalizePayload(p: DocumentUpsertPayload): DocumentUpsertPayload {
    const trimOrNull = (v: string | null | undefined): string | null => {
      const t = String(v ?? '').trim();
      return t ? t : null;
    };
    return {
      idNatureDocument: p.idNatureDocument ?? null,
      idTypeDocument: p.idTypeDocument ?? null,
      idCentre: p.idCentre ?? null,
      codeDocument: trimOrNull(p.codeDocument),
      existe: trimOrNull(p.existe),
      ajour: trimOrNull(p.ajour),
      bientenu: trimOrNull(p.bientenu),
      respmethode: trimOrNull(p.respmethode),
      bienrensigne: trimOrNull(p.bienrensigne),
    };
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
