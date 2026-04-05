import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { formatHttpError } from '@core/utils/http-error.util';

@Component({
  selector: 'app-referentiel-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './referentiel-list-page.component.html',
  styleUrl: './referentiel-list-page.component.css',
})
export class ReferentielListPageComponent implements OnInit, OnDestroy, OnChanges {
  @Input() inputTitle?: string;
  @Input() inputApiPath?: string;
  @Input() inputCreateFields?: ReferentielFormField[];
  @Input() addFormContextLabel?: string;
  @Input() addFormContextOptions?: Array<{ value: string; label: string }>;
  @Input() addFormContextValue?: string;
  @Output() addFormContextValueChange = new EventEmitter<string>();

  title = '';
  apiPath = '';
  createFields: ReferentielFormField[] = [];
  loading = false;
  errorMessage: string | null = null;
  rows: Record<string, unknown>[] = [];
  columns: string[] = [];
  lastSyncedAt: Date | null = null;
  successMessage: string | null = null;

  /** Filtre texte client sur les colonnes affichées */
  listFilter = '';

  /**
   * Colonne booléenne détectée (ex. etatAnneeScolaire, etatCampagne) pour la carte répartition ;
   * null si aucun champ pertinent dans les données.
   */
  etatStatsColumn: string | null = null;

  /** Modal formulaire création / édition */
  formModalOpen = false;
  formMode: 'create' | 'edit' = 'create';
  /** Identifiant pour PUT / DELETE (souvent `id` dans le JSON liste) */
  editingId: string | number | null = null;
  recordForm: FormGroup | null = null;
  formSubmitting = false;
  formError: string | null = null;

  /** Modal confirmation suppression */
  deleteModalOpen = false;
  deleteTargetId: string | number | null = null;
  deleteTargetLabel = '';
  deleteSubmitting = false;
  deleteError: string | null = null;
  fieldOptions: Record<string, Array<{ value: string | number; label: string }>> = {};

  private dataSub?: Subscription;
  private loadSub?: Subscription;
  private optionSubs: Subscription[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly fb: FormBuilder,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnInit(): void {
    this.dataSub = this.route.data.subscribe((data) => {
      const routeTitle = (data['title'] as string) ?? 'Référentiel';
      const routeApiPath = (data['apiPath'] as string) ?? '';
      const routeCreateFields = (data['createFields'] as ReferentielFormField[]) ?? [];
      this.title = this.inputTitle ?? routeTitle;
      this.apiPath = this.inputApiPath ?? routeApiPath;
      this.createFields = this.inputCreateFields ?? routeCreateFields;
      this.fetch();
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    // Supporte une utilisation en composant imbriqué avec config dynamique.
    if (!this.dataSub) {
      return;
    }
    if (this.inputTitle != null) this.title = this.inputTitle;
    if (this.inputApiPath != null) this.apiPath = this.inputApiPath;
    if (this.inputCreateFields != null) this.createFields = this.inputCreateFields;
    if (this.formModalOpen && this.formMode === 'create' && this.hasCreateForm) {
      this.recordForm = this.buildRecordForm();
      // Si le contexte (ex: type de centre) change dans la modal, recharge les listes liées.
      this.loadFieldOptions();
    }
    this.fetch();
  }

  onAddFormContextChange(ev: Event): void {
    const target = ev.target as HTMLSelectElement | null;
    const v = String(target?.value ?? '').trim();
    if (!v) return;
    this.addFormContextValueChange.emit(v);
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.loadSub?.unsubscribe();
    for (const s of this.optionSubs) s.unsubscribe();
  }

  get hasCreateForm(): boolean {
    return this.createFields.length > 0;
  }

  /** Carte actifs / inactifs : uniquement si une colonne d’état booléenne est détectée. */
  get hasEtatStats(): boolean {
    return !this.loading && this.etatStatsColumn != null;
  }

  get hasActiveFilter(): boolean {
    return !!this.listFilter?.trim();
  }

  get filteredRows(): Record<string, unknown>[] {
    const q = this.listFilter.trim().toLowerCase();
    if (!q) {
      return this.rows;
    }
    return this.rows.filter((row) => this.rowMatchesFilter(row, q));
  }

  get countEtatActif(): number {
    const k = this.etatStatsColumn;
    if (!k) {
      return 0;
    }
    return this.rows.filter((row) => this.isTruthyEtat(row[k])).length;
  }

  get countEtatInactif(): number {
    const k = this.etatStatsColumn;
    if (!k) {
      return 0;
    }
    return this.rows.filter((row) => this.isFalsyEtat(row[k])).length;
  }

  /** Libellé lisible pour la colonne d’état (carte). */
  get etatColumnShortLabel(): string {
    if (!this.etatStatsColumn) {
      return '';
    }
    const s = this.etatStatsColumn.replace(/([A-Z])/g, ' $1').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  get formModalTitle(): string {
    if (!this.hasCreateForm) {
      return this.formMode === 'edit' ? 'Modifier' : 'Ajout';
    }
    return this.formMode === 'edit'
      ? 'Modifier l’enregistrement'
      : 'Nouvel enregistrement';
  }

  get canUseRowActions(): boolean {
    return !!this.apiPath;
  }

  formatCell(value: unknown): string {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'object') {
      const s = JSON.stringify(value);
      return s.length > 120 ? `${s.slice(0, 117)}…` : s;
    }
    return String(value);
  }

  getFieldOptions(field: ReferentielFormField): Array<{ value: string | number; label: string }> {
    return this.fieldOptions[this.optionsCacheKey(field)] ?? [];
  }

  clearListFilter(): void {
    this.listFilter = '';
  }

  formatSyncTime(): string {
    if (!this.lastSyncedAt) {
      return '—';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(this.lastSyncedAt);
  }

  refresh(): void {
    this.successMessage = null;
    this.listFilter = '';
    this.fetch();
  }

  resolveRowId(row: Record<string, unknown>): string | number | null {
    const v = row['id'];
    if (typeof v === 'number' && !Number.isNaN(v)) {
      return v;
    }
    if (typeof v === 'string' && v.trim() !== '') {
      return v;
    }
    return null;
  }

  openCreateModal(): void {
    this.formError = null;
    this.formMode = 'create';
    this.editingId = null;
    if (!this.hasCreateForm) {
      this.recordForm = null;
      this.formModalOpen = true;
      return;
    }
    this.loadFieldOptions();
    this.recordForm = this.buildRecordForm();
    this.formModalOpen = true;
  }

  openEditModal(row: Record<string, unknown>): void {
    if (!this.hasCreateForm) {
      return;
    }
    const id = this.resolveRowId(row);
    if (id == null) {
      return;
    }
    this.formError = null;
    this.formMode = 'edit';
    this.editingId = id;
    this.loadFieldOptions();
    this.recordForm = this.buildRecordForm(this.rowToFormValues(row));
    this.formModalOpen = true;
  }

  closeFormModal(): void {
    this.formModalOpen = false;
    this.recordForm = null;
    this.formError = null;
    this.formSubmitting = false;
    this.editingId = null;
  }

  submitRecord(): void {
    if (!this.recordForm || !this.apiPath) {
      return;
    }
    this.recordForm.markAllAsTouched();
    if (this.recordForm.invalid) {
      return;
    }
    const payload = this.buildPayload(this.recordForm.getRawValue());
    this.formSubmitting = true;
    this.formError = null;

    if (this.formMode === 'create') {
      const url = `${this.apiBaseUrl}${this.apiPath}`;
      this.http.post<unknown>(url, payload).subscribe({
        next: () => this.onFormSuccess('Enregistrement créé avec succès.'),
        error: (err: HttpErrorResponse) => this.onFormHttpError(err),
      });
      return;
    }

    if (this.editingId == null) {
      this.formSubmitting = false;
      return;
    }
    const url = `${this.apiBaseUrl}${this.apiPath}/${encodeURIComponent(String(this.editingId))}`;
    this.http.put<unknown>(url, payload).subscribe({
      next: () => this.onFormSuccess('Enregistrement mis à jour.'),
      error: (err: HttpErrorResponse) => this.onFormHttpError(err),
    });
  }

  private onFormSuccess(msg: string): void {
    this.formSubmitting = false;
    this.closeFormModal();
    this.successMessage = msg;
    this.fetch();
  }

  private onFormHttpError(err: HttpErrorResponse): void {
    this.formSubmitting = false;
    this.formError = formatHttpError(
      err,
      'Opération refusée (données invalides, contraintes serveur ou droits).',
    );
  }

  openDeleteModal(row: Record<string, unknown>): void {
    const id = this.resolveRowId(row);
    if (id == null) {
      return;
    }
    this.deleteError = null;
    this.deleteTargetId = id;
    this.deleteTargetLabel = this.buildDeleteLabel(row);
    this.deleteModalOpen = true;
  }

  cancelDelete(): void {
    this.deleteModalOpen = false;
    this.deleteTargetId = null;
    this.deleteTargetLabel = '';
    this.deleteSubmitting = false;
    this.deleteError = null;
  }

  confirmDelete(): void {
    if (this.deleteTargetId == null || !this.apiPath) {
      return;
    }
    this.deleteSubmitting = true;
    this.deleteError = null;
    const url = `${this.apiBaseUrl}${this.apiPath}/${encodeURIComponent(String(this.deleteTargetId))}`;
    this.http.delete(url).subscribe({
      next: () => {
        this.deleteSubmitting = false;
        this.cancelDelete();
        this.successMessage = 'Enregistrement supprimé.';
        this.fetch();
      },
      error: (err: HttpErrorResponse) => {
        this.deleteSubmitting = false;
        this.deleteError = formatHttpError(
          err,
          'Suppression impossible (contraintes métier, rattachements ou droits).',
        );
      },
    });
  }

  private buildDeleteLabel(row: Record<string, unknown>): string {
    const id = this.resolveRowId(row);
    for (const col of this.columns) {
      if (col === 'id') {
        continue;
      }
      const v = row[col];
      if (v !== null && v !== undefined && typeof v !== 'object') {
        const s = String(v).trim();
        if (s) {
          return s.length > 80 ? `${s.slice(0, 77)}…` : s;
        }
      }
    }
    return `#${id}`;
  }

  private buildRecordForm(
    initial?: Record<string, unknown> | null,
  ): FormGroup {
    const controls: Record<string, unknown> = {};
    for (const f of this.createFields) {
      const validators = [];
      if (f.required) {
        validators.push(Validators.required);
      }
      if (f.maxLength != null && f.maxLength > 0) {
        validators.push(Validators.maxLength(f.maxLength));
      }
      let val: unknown;
      if (initial && f.key in initial) {
        val = initial[f.key];
      } else {
        val = f.type === 'checkbox' ? false : (f.type === 'number' || f.type === 'select') ? null : '';
      }
      controls[f.key] = [val, validators];
    }
    return this.fb.group(controls);
  }

  private rowToFormValues(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of this.createFields) {
      let v = row[f.key];
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        const o = v as Record<string, unknown>;
        if ('id' in o && (typeof o['id'] === 'number' || typeof o['id'] === 'string')) {
          v = o['id'];
        }
      }
      if (f.type === 'checkbox') {
        out[f.key] = !!v;
      } else if (f.type === 'number' || f.type === 'select') {
        if (v === null || v === undefined || v === '') {
          out[f.key] = null;
        } else {
          const n = typeof v === 'number' ? v : Number(v);
          out[f.key] = Number.isNaN(n) ? null : n;
        }
      } else if (f.type === 'date' && typeof v === 'string' && v.length >= 10) {
        out[f.key] = v.slice(0, 10);
      } else {
        out[f.key] = v ?? '';
      }
    }
    return out;
  }

  private buildPayload(raw: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of this.createFields) {
      const v = raw[f.key];
      if (f.type === 'checkbox') {
        out[f.key] = !!v;
        continue;
      }
      if (v === '' || v === null || v === undefined) {
        if (f.required) {
          out[f.key] = v;
        }
        continue;
      }
      if (f.type === 'number' || f.type === 'select') {
        if (v === '' || v === null || v === undefined) {
          if (f.required) {
            out[f.key] = null;
          }
          continue;
        }
        const n = typeof v === 'number' ? v : Number(v);
        if (!Number.isNaN(n)) {
          out[f.key] = f.type === 'select' && f.payloadAsObjectId ? { id: n } : n;
        }
      } else {
        out[f.key] = v;
      }
    }
    return out;
  }

  private rowMatchesFilter(row: Record<string, unknown>, q: string): boolean {
    const id = this.resolveRowId(row);
    if (id != null && String(id).toLowerCase().includes(q)) {
      return true;
    }
    for (const col of this.columns) {
      if (this.formatCell(row[col]).toLowerCase().includes(q)) {
        return true;
      }
    }
    return false;
  }

  private isTruthyEtat(v: unknown): boolean {
    if (typeof v === 'boolean') {
      return v;
    }
    if (typeof v === 'number') {
      return v !== 0;
    }
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return s === 'true' || s === '1' || s === 'oui' || s === 'yes';
    }
    return false;
  }

  private isFalsyEtat(v: unknown): boolean {
    if (v === null || v === undefined) {
      return false;
    }
    if (typeof v === 'boolean') {
      return !v;
    }
    if (typeof v === 'number') {
      return v === 0;
    }
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase();
      return s === 'false' || s === '0' || s === 'non' || s === 'no';
    }
    return false;
  }

  /**
   * Détecte une colonne booléenne « état / actif » (ex. etatAnneeScolaire) pour afficher la carte répartition.
   */
  private detectEtatColumn(): void {
    this.etatStatsColumn = null;
    if (!this.rows.length || !this.columns.length) {
      return;
    }

    const keyMatches = (k: string) =>
      /etat/i.test(k) ||
      /^(actif|active|enabled)$/i.test(k) ||
      /actif$/i.test(k);

    const columnLooksBoolean = (key: string): boolean => {
      let defined = 0;
      for (const row of this.rows) {
        const v = row[key];
        if (v === null || v === undefined) {
          continue;
        }
        defined++;
        const t = typeof v;
        if (t !== 'boolean' && t !== 'number' && t !== 'string') {
          return false;
        }
        if (t === 'number' && v !== 0 && v !== 1) {
          return false;
        }
        if (t === 'string') {
          const s = String(v).trim().toLowerCase();
          if (
            !['true', 'false', '0', '1', 'oui', 'non', 'yes', 'no', ''].includes(
              s,
            )
          ) {
            return false;
          }
        }
      }
      return defined > 0;
    };

    for (const key of this.columns) {
      if (!keyMatches(key) || !columnLooksBoolean(key)) {
        continue;
      }
      this.etatStatsColumn = key;
      return;
    }
  }

  private fetch(): void {
    this.loadSub?.unsubscribe();
    if (!this.apiPath) {
      this.errorMessage = 'Configuration de route incomplète (apiPath).';
      return;
    }
    this.loading = true;
    this.errorMessage = null;
    const url = `${this.apiBaseUrl}${this.apiPath}`;
    this.loadSub = this.http.get<unknown>(url).subscribe({
      next: (body) => {
        const list = Array.isArray(body) ? body : [];
        this.rows = list as Record<string, unknown>[];
        this.buildColumns();
        this.detectEtatColumn();
        this.lastSyncedAt = new Date();
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = formatHttpError(
          err,
          'Impossible de charger les données (réseau, CORS, session ou erreur serveur).',
        );
        this.loading = false;
        this.rows = [];
        this.columns = [];
        this.etatStatsColumn = null;
      },
    });
  }

  private buildColumns(): void {
    if (!this.rows.length) {
      this.columns = [];
      return;
    }
    const first = this.rows[0];
    const keys = Object.keys(first).filter(
      (k) => !k.startsWith('_') && k !== 'hibernateLazyInitializer',
    );
    const hiddenIds = new Set<string>();
    for (const k of keys) {
      if (!k.startsWith('id') || k.length <= 2) continue;
      const suffix = k.slice(2);
      const labelCandidates = [`nom${suffix}`, `libelle${suffix}`, `label${suffix}`];
      if (labelCandidates.some((c) => c in first)) hiddenIds.add(k);
    }
    const visibleKeys = keys.filter((k) => !hiddenIds.has(k));
    visibleKeys.sort();
    this.columns = visibleKeys.slice(0, 18);
  }

  private loadFieldOptions(): void {
    for (const field of this.createFields) {
      if (field.type !== 'select' || !field.optionsApiPath) continue;
      const cacheKey = this.optionsCacheKey(field);
      if ((this.fieldOptions[cacheKey]?.length ?? 0) > 0) continue;
      const sub = this.http.get<unknown[]>(`${this.apiBaseUrl}${field.optionsApiPath}`).subscribe({
        next: (rows) => {
          const list = Array.isArray(rows) ? rows : [];
          this.fieldOptions[cacheKey] = list
            .map((row) => this.toOption(field, row as Record<string, unknown>))
            .filter((x): x is { value: string | number; label: string } => x != null);
        },
        error: () => {
          this.fieldOptions[cacheKey] = [];
        },
      });
      this.optionSubs.push(sub);
    }
  }

  private optionsCacheKey(field: ReferentielFormField): string {
    return `${field.key}::${field.optionsApiPath ?? ''}`;
  }

  private toOption(field: ReferentielFormField, row: Record<string, unknown>): { value: string | number; label: string } | null {
    const valueKey = field.optionValueKey ?? 'id';
    const valueRaw = row[valueKey];
    if (typeof valueRaw !== 'string' && typeof valueRaw !== 'number') return null;

    const labelKeys = field.optionLabelKeys ?? ['libelle', 'nom', 'label', 'code', 'id'];
    const parts: string[] = [];
    for (const k of labelKeys) {
      const v = row[k];
      if (v == null) continue;
      const s = String(v).trim();
      if (s) parts.push(s);
    }
    return { value: valueRaw, label: parts.length ? parts.join(' - ') : String(valueRaw) };
  }
}
