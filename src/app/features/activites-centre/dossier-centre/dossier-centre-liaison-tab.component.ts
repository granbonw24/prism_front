import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import {
  libelleOrId,
  refEntityLabelForSelect,
  sortByLabel,
  type MenaSelectOption,
} from '@shared/mena-searchable-select/mena-select-options.util';
import type { DossierCentreLiaisonConfig, DossierLiaisonExtraField } from './dossier-centre-liaison.config';
import { forkJoin, of } from 'rxjs';

type Ref = {
  id?: number | null;
  libelle?: string | null;
  code?: string | null;
};

type LiaisonRow = Record<string, unknown> & { id?: number | null };

/** Une ligne cochable : catalogue ou libellé langue. */
type AffectionLine = {
  lineKey: string;
  catalogId: number | null;
  label: string;
  code: string | null;
  checked: boolean;
  liaisonId: number | null;
  extra: Record<string, string | number | null>;
};

@Component({
  selector: 'app-dossier-centre-liaison-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, MenaLoadingComponent],
  template: `
    <div class="card border-0 shadow-sm h-100">
      <div class="card-header bg-white">
        <h6 class="m-0 font-weight-bold text-primary">{{ config.title }}</h6>
        <p class="small text-muted mb-0 mt-1">
          Cochez une ou plusieurs lignes pour ce centre, puis enregistrez.
          <span *ngIf="config.catalogApiPath"> Catalogue dans Paramétrage.</span>
          <span *ngIf="config.otherCatalogTokens?.length">
            Cochez « Autre » puis précisez dans la colonne dédiée.
          </span>
        </p>
      </div>
      <div class="card-body">
        <app-mena-loading *ngIf="loading" size="sm" [inline]="true" message="Chargement…" />

        <ng-container *ngIf="!loading && centreId != null">
          <div class="d-flex flex-wrap align-items-center justify-content-between mb-2" style="gap: 0.5rem">
            <span class="small text-muted">
              {{ checkedCount }} / {{ lines.length }} sélectionné(s)
            </span>
            <button
              type="button"
              class="btn btn-sm btn-primary"
              (click)="syncAffections()"
              [disabled]="saving || !hasChanges"
            >
              {{ saving ? 'Enregistrement…' : 'Enregistrer les affectations' }}
            </button>
          </div>

          <div *ngIf="syncError" class="alert alert-danger py-2 small">{{ syncError }}</div>
          <div *ngIf="syncSuccess" class="alert alert-success py-2 small">{{ syncSuccess }}</div>

          <div class="table-responsive">
            <table class="table table-sm table-bordered mb-0">
              <thead class="thead-light">
                <tr>
                  <th class="text-center" style="width: 2.75rem" scope="col">
                    <span class="sr-only">Cocher</span>
                  </th>
                  <th scope="col">{{ listColumnLabel }}</th>
                  <th *ngFor="let field of config.extraFields ?? []" scope="col">{{ field.label }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let line of lines">
                  <td class="text-center align-middle">
                    <input
                      type="checkbox"
                      class="form-check-input m-0"
                      [(ngModel)]="line.checked"
                      (ngModelChange)="onLineToggled(line)"
                      [attr.aria-label]="'Affecter ' + line.label"
                    />
                  </td>
                  <td class="align-middle">
                    <span class="font-weight-bold">{{ line.label }}</span>
                  </td>
                  <td *ngFor="let field of config.extraFields ?? []" class="align-middle">
                    <ng-container *ngIf="line.checked && showExtraForLine(line, field)">
                      <input
                        *ngIf="field.type === 'text'"
                        type="text"
                        class="form-control form-control-sm"
                        [(ngModel)]="line.extra[field.key]"
                        [attr.maxlength]="field.maxLength ?? null"
                        [placeholder]="field.label"
                      />
                      <select
                        *ngIf="field.type === 'select'"
                        class="form-control form-control-sm"
                        [(ngModel)]="line.extra[field.key]"
                      >
                        <option [ngValue]="''">— Sélectionner —</option>
                        <option *ngFor="let opt of extraSelectOptions(field)" [ngValue]="opt.value">
                          {{ opt.label }}
                        </option>
                      </select>
                      <input
                        *ngIf="field.type === 'number'"
                        type="number"
                        class="form-control form-control-sm"
                        [(ngModel)]="line.extra[field.key]"
                        [placeholder]="field.label"
                      />
                    </ng-container>
                    <span *ngIf="!line.checked || !showExtraForLine(line, field)" class="text-muted">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div *ngIf="config.allowsCustomLabelEntry" class="mt-3 border-top pt-3">
            <label class="small font-weight-bold text-muted">{{
              config.customEntryLabel ?? 'Autre (libellé libre)'
            }}</label>
            <div class="form-row align-items-end">
              <div class="form-group col-md-8 mb-0">
                <input
                  type="text"
                  class="form-control form-control-sm"
                  [(ngModel)]="customLabelDraft"
                  maxlength="100"
                  [placeholder]="config.customEntryPlaceholder ?? 'Saisir un libellé non listé'"
                />
              </div>
              <div class="form-group col-md-4 mb-0">
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary btn-block"
                  (click)="addCustomLabelLine()"
                  [disabled]="!customLabelDraft.trim()"
                >
                  Ajouter à la liste
                </button>
              </div>
            </div>
          </div>
        </ng-container>
      </div>
    </div>
  `,
})
export class DossierCentreLiaisonTabComponent implements OnChanges {
  @Input({ required: true }) config!: DossierCentreLiaisonConfig;
  @Input() centreId: number | string | null = null;

  loading = false;
  saving = false;
  syncError: string | null = null;
  syncSuccess: string | null = null;
  lines: AffectionLine[] = [];
  snapshot = '';
  catalog: Ref[] = [];
  centreRows: LiaisonRow[] = [];
  customLabelDraft = '';
  private selectOptionsByFieldKey = new Map<string, MenaSelectOption<string>[]>();

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  get listColumnLabel(): string {
    if (this.config.selectionMode === 'label-catalog') {
      return "Langue (paramétrage langue_apprentissage)";
    }
    return this.config.catalogSelectLabel ?? this.config.catalogRefKey ?? 'Élément';
  }

  get checkedCount(): number {
    return this.lines.filter((l) => l.checked).length;
  }

  get hasChanges(): boolean {
    return this.serializeLines() !== this.snapshot;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['centreId'] || changes['config']) {
      this.syncError = null;
      this.syncSuccess = null;
      this.customLabelDraft = '';
      this.selectOptionsByFieldKey.clear();
      this.reload();
    }
  }

  onLineToggled(line: AffectionLine): void {
    if (!line.checked) {
      for (const field of this.config.extraFields ?? []) {
        line.extra[field.key] = field.type === 'number' ? null : '';
      }
    }
    this.syncSuccess = null;
  }

  showExtraForLine(line: AffectionLine, field: DossierLiaisonExtraField): boolean {
    if (
      field.key === 'libelleAutreMateriel' ||
      field.key === 'libelleAutreInfrastructure' ||
      field.key === 'libelleAutreSupport'
    ) {
      return this.isOtherLine(line);
    }
    return true;
  }

  extraSelectOptions(field: DossierLiaisonExtraField): MenaSelectOption<string>[] {
    return this.selectOptionsByFieldKey.get(field.key) ?? [];
  }

  addCustomLabelLine(): void {
    const label = this.customLabelDraft.trim();
    if (!label) {
      return;
    }
    const key = this.labelCatalogKey(label);
    const existing = this.lines.find((l) => l.lineKey === key);
    if (existing) {
      existing.checked = true;
    } else {
      const row = this.centreRows.find(
        (r) => String(r['libelleLangue'] ?? '').trim().toLowerCase() === label.toLowerCase(),
      );
      this.lines.push({
        lineKey: key,
        catalogId: null,
        label,
        code: null,
        checked: true,
        liaisonId: typeof row?.id === 'number' ? row.id : null,
        extra: {},
      });
    }
    this.customLabelDraft = '';
  }

  syncAffections(): void {
    const idCentre = this.resolvedCentreId();
    if (idCentre == null || this.saving) {
      this.syncError =
        idCentre == null
          ? 'Sélectionnez un centre valide avant d’enregistrer les affectations.'
          : null;
      return;
    }
    this.saving = true;
    this.syncError = null;
    this.syncSuccess = null;

    const initial = JSON.parse(this.snapshot) as Array<{
      lineKey: string;
      checked: boolean;
      liaisonId: number | null;
      extra: Record<string, string | number | null>;
    }>;
    const payload = this.buildSyncPayload(initial, idCentre);
    if (!payload) {
      this.saving = false;
      this.syncSuccess = 'Aucune modification à enregistrer.';
      return;
    }

    const syncPath = this.config.syncApiPath ?? `${this.config.apiPath}/sync`;
    const url = `${this.apiBaseUrl}${syncPath}`;
    this.http.post(url, payload).subscribe({
      next: () => {
        this.saving = false;
        this.syncSuccess = 'Affectations enregistrées.';
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.syncError = this.syncErrorMessage(err, syncPath);
        this.reload();
      },
    });
  }

  reload(): void {
    if (this.resolvedCentreId() == null) {
      this.lines = [];
      this.snapshot = '[]';
      return;
    }
    this.loading = true;
    const links$ = this.http.get<unknown>(`${this.apiBaseUrl}${this.config.apiPath}`);

    if (this.config.selectionMode === 'label-catalog') {
      const catalog$ = this.config.catalogApiPath
        ? this.http.get<unknown>(`${this.apiBaseUrl}${this.config.catalogApiPath}`)
        : of([]);
      forkJoin({ catalog: catalog$, links: links$ }).subscribe({
        next: ({ catalog, links }) => {
          const labelField = this.config.catalogLabelField ?? 'libelleLangue';
          const catalogRows = unwrapListBody(catalog) as LiaisonRow[];
          const catalogLabels = this.distinctLabelsFromRows(catalogRows, labelField);
          this.centreRows = (unwrapListBody(links) as LiaisonRow[]).filter((row) =>
            this.rowMatchesCentre(row),
          );
          this.lines = this.buildLabelCatalogLines(catalogLabels);
          this.captureSnapshot();
          this.loading = false;
        },
        error: () => {
          this.centreRows = [];
          this.lines = this.buildLabelCatalogLines([]);
          this.captureSnapshot();
          this.loading = false;
        },
      });
      return;
    }

    const catalog$ = this.config.catalogApiPath
      ? this.http.get<unknown>(`${this.apiBaseUrl}${this.config.catalogApiPath}`)
      : of([]);

    forkJoin({ catalog: catalog$, links: links$ }).subscribe({
      next: ({ catalog, links }) => {
        this.catalog = this.mapCatalog(catalog);
        this.centreRows = (unwrapListBody(links) as LiaisonRow[]).filter((row) =>
          this.rowMatchesCentre(row),
        );
        this.lines = this.buildCatalogLines();
        this.loadExtraSelectOptions(() => {
          this.captureSnapshot();
          this.loading = false;
        });
      },
      error: () => {
        this.lines = [];
        this.captureSnapshot();
        this.loading = false;
      },
    });
  }

  private buildCatalogLines(): AffectionLine[] {
    return this.catalog
      .filter((item) => item.id != null)
      .map((item) => {
        const catalogId = item.id as number;
        const link = this.findLinkByCatalogId(catalogId);
        const extra: Record<string, string | number | null> = {};
        for (const field of this.config.extraFields ?? []) {
          const raw = link?.[field.key];
          if (field.type === 'number') {
            extra[field.key] = raw != null && raw !== '' ? Number(raw) : null;
          } else {
            extra[field.key] = raw != null ? String(raw) : '';
          }
        }
        return {
          lineKey: `cat-${catalogId}`,
          catalogId,
          label: this.catalogOptionLabel(item),
          code: item.code?.trim() || null,
          checked: link != null,
          liaisonId: typeof link?.id === 'number' ? link.id : null,
          extra,
        };
      })
      .sort((a, b) => this.compareCatalogLines(a, b));
  }

  private compareCatalogLines(a: AffectionLine, b: AffectionLine): number {
    const aOther = this.isOtherLine(a);
    const bOther = this.isOtherLine(b);
    if (aOther !== bOther) {
      return aOther ? 1 : -1;
    }
    return a.label.localeCompare(b.label, 'fr');
  }

  private buildLabelCatalogLines(catalogLabels: string[]): AffectionLine[] {
    const labelField = this.config.catalogLabelField ?? 'libelleLangue';
    const labels = new Set<string>(catalogLabels.map((l) => l.trim()).filter(Boolean));

    for (const row of this.centreRows) {
      const lib = String(row[labelField] ?? '').trim();
      if (lib) {
        labels.add(lib);
      }
    }

    return [...labels]
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map((label) => {
        const row = this.centreRows.find(
          (r) => String(r[labelField] ?? '').trim().toLowerCase() === label.toLowerCase(),
        );
        return {
          lineKey: this.labelCatalogKey(label),
          catalogId: null,
          label,
          code: null,
          checked: row != null,
          liaisonId: typeof row?.id === 'number' ? row.id : null,
          extra: {},
        };
      });
  }

  private distinctLabelsFromRows(rows: LiaisonRow[], labelField: string): string[] {
    const labels = new Set<string>();
    for (const row of rows) {
      const lib = String(row[labelField] ?? row['libelle'] ?? '').trim();
      if (lib) {
        labels.add(lib);
      }
    }
    return [...labels].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  private loadExtraSelectOptions(done: () => void): void {
    const selectFields =
      this.config.extraFields?.filter((f) => f.type === 'select' && f.selectOptionsApiPath) ?? [];
    if (selectFields.length === 0) {
      done();
      return;
    }
    const requests: Record<string, ReturnType<HttpClient['get']>> = {};
    for (const field of selectFields) {
      requests[field.key] = this.http.get<unknown>(`${this.apiBaseUrl}${field.selectOptionsApiPath}`);
    }
    forkJoin(requests).subscribe({
      next: (responses) => {
        for (const field of selectFields) {
          this.selectOptionsByFieldKey.set(
            field.key,
            this.mapSelectOptions(responses[field.key], field),
          );
        }
        done();
      },
      error: () => {
        done();
      },
    });
  }

  private mapSelectOptions(body: unknown, field: DossierLiaisonExtraField): MenaSelectOption<string>[] {
    const valueKey = field.selectOptionValueKey ?? 'code';
    const rows = unwrapListBody(body) as Record<string, unknown>[];
    const options = rows
      .map((row) => {
        const value = this.pickSelectValue(row, valueKey);
        if (!value) {
          return null;
        }
        return {
          value,
          label: refEntityLabelForSelect(row, field.selectOptionLabelKeys ?? ['libelle']),
        };
      })
      .filter((opt): opt is MenaSelectOption<string> => opt != null);
    return sortByLabel(options, (o) => o.label);
  }

  private pickSelectValue(row: Record<string, unknown>, valueKey: string): string | null {
    const generic = row[valueKey];
    if (typeof generic === 'string' && generic.trim()) {
      return generic.trim();
    }
    if (valueKey === 'code') {
      for (const key of Object.keys(row)) {
        if (key.toLowerCase().includes('code') && typeof row[key] === 'string' && String(row[key]).trim()) {
          return String(row[key]).trim();
        }
      }
    }
    if (typeof row['id'] === 'number') {
      return String(row['id']);
    }
    return null;
  }

  private findLinkByCatalogId(catalogId: number): LiaisonRow | undefined {
    return this.centreRows.find((row) => {
      const ref = this.rowRef(row, this.config.catalogRefKey);
      if (ref?.id === catalogId) {
        return true;
      }
      const fk = this.rowFkValue(row);
      return fk === catalogId;
    });
  }

  private resolvedCentreId(): number | null {
    if (this.centreId == null || this.centreId === '') {
      return null;
    }
    const n = Number(this.centreId);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  private syncErrorMessage(err: HttpErrorResponse, syncPath: string): string {
    const body = err.error;
    if (body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string') {
      return (body as { message: string }).message;
    }
    if (err.status === 404) {
      return `Endpoint ${syncPath} introuvable. Redémarrez le backend (mvn spring-boot:run).`;
    }
    return 'Enregistrement impossible. Vérifiez les données ou réessayez.';
  }

  private buildSyncPayload(
    initial: Array<{
      lineKey: string;
      checked: boolean;
      liaisonId: number | null;
      extra: Record<string, string | number | null>;
    }>,
    idCentre: number,
  ): Record<string, unknown> | null {

    if (this.config.selectionMode === 'label-catalog') {
      const createLabels: string[] = [];
      const deleteLiaisonIds: number[] = [];
      for (const line of this.lines) {
        const before = initial.find((b) => b.lineKey === line.lineKey);
        const linkId = line.liaisonId ?? before?.liaisonId ?? null;
        if (line.checked && linkId == null) {
          createLabels.push(line.label.trim());
        } else if (!line.checked && linkId != null) {
          deleteLiaisonIds.push(linkId);
        }
      }
      if (createLabels.length === 0 && deleteLiaisonIds.length === 0) {
        return null;
      }
      return { idCentre, createLabels, deleteLiaisonIds };
    }

    const createCatalogIds: number[] = [];
    const deleteLiaisonIds: number[] = [];
    const updates: Record<string, unknown>[] = [];

    for (const line of this.lines) {
      const before = initial.find((b) => b.lineKey === line.lineKey);
      const wasChecked = !!before?.checked;
      const linkId = line.liaisonId ?? before?.liaisonId ?? null;

      if (line.checked && linkId == null && line.catalogId != null) {
        createCatalogIds.push(line.catalogId);
        if (this.lineHasExtraValues(line)) {
          updates.push(this.buildUpdateItem(line, null));
        }
      } else if (!line.checked && linkId != null) {
        deleteLiaisonIds.push(linkId);
      } else if (
        line.checked &&
        linkId != null &&
        wasChecked &&
        this.lineExtraChanged(before, line)
      ) {
        updates.push(this.buildUpdateItem(line, linkId));
      }
    }

    if (createCatalogIds.length === 0 && deleteLiaisonIds.length === 0 && updates.length === 0) {
      return null;
    }
    return { idCentre, createCatalogIds, deleteLiaisonIds, updates };
  }

  private lineHasExtraValues(line: AffectionLine): boolean {
    for (const field of this.config.extraFields ?? []) {
      if (
        field.key === 'libelleAutreMateriel' ||
        field.key === 'libelleAutreInfrastructure' ||
        field.key === 'libelleAutreSupport'
      ) {
        if (!this.isOtherLine(line)) {
          continue;
        }
      }
      const v = line.extra[field.key];
      if (field.type === 'number') {
        if (v !== null && v !== '' && !Number.isNaN(Number(v))) {
          return true;
        }
      } else if (v != null && String(v).trim() !== '') {
        return true;
      }
    }
    return false;
  }

  private buildUpdateItem(line: AffectionLine, liaisonId: number | null): Record<string, unknown> {
    const item: Record<string, unknown> = {
      catalogId: line.catalogId,
    };
    if (liaisonId != null) {
      item['liaisonId'] = liaisonId;
    }
    for (const field of this.config.extraFields ?? []) {
      if (
        (field.key === 'libelleAutreMateriel' ||
          field.key === 'libelleAutreInfrastructure' ||
          field.key === 'libelleAutreSupport') &&
        !this.isOtherLine(line)
      ) {
        continue;
      }
      const v = line.extra[field.key];
      if (field.type === 'number') {
        if (v !== null && v !== '' && !Number.isNaN(Number(v))) {
          item[field.key] = Number(v);
        }
      } else if (v !== null && String(v).trim() !== '') {
        item[field.key] = String(v).trim();
      }
    }
    return item;
  }

  private isOtherLine(line: AffectionLine): boolean {
    return this.isOtherCatalogLabel(line.label, line.code);
  }

  private isOtherCatalogLabel(label: string, code: string | null): boolean {
    const tokens = this.config.otherCatalogTokens ?? ['autre'];
    const labelNorm = label.trim().toLowerCase();
    const codeNorm = (code ?? '').trim().toLowerCase();
    return tokens.some((token) => {
      const t = token.trim().toLowerCase();
      if (!t) {
        return false;
      }
      if (labelNorm === t || labelNorm === `${t}s` || codeNorm === t) {
        return true;
      }
      const word = new RegExp(`\\b${t}s?\\b`, 'i');
      return word.test(label) || word.test(code ?? '');
    });
  }

  private labelCatalogKey(label: string): string {
    return `label-${label.trim().toLowerCase()}`;
  }

  private rowMatchesCentre(row: LiaisonRow): boolean {
    const cid = this.resolvedCentreId();
    if (cid == null) {
      return false;
    }
    const centreKeys = [
      this.config.centreRefKey,
      'Alpha',
      'Centre',
      'Cp',
      'Cec',
      'Sie',
    ];
    for (const key of centreKeys) {
      const ref = this.rowRef(row, key);
      if (ref?.id === cid) {
        return true;
      }
    }
    return false;
  }

  /** Référentiel imbriqué (clé PascalCase ou camelCase renvoyée par l’API). */
  private rowRef(row: LiaisonRow, key: string): Ref | undefined {
    if (!key) {
      return undefined;
    }
    const camel = key.charAt(0).toLowerCase() + key.slice(1);
    const raw = row[key] ?? row[camel];
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
      return undefined;
    }
    const o = raw as Record<string, unknown>;
    return {
      id: typeof o['id'] === 'number' ? o['id'] : null,
      libelle: typeof o['libelle'] === 'string' ? o['libelle'] : null,
      code: typeof o['code'] === 'string' ? o['code'] : null,
    };
  }

  private rowFkValue(row: LiaisonRow): number | null {
    const camel = this.config.fkField.charAt(0).toLowerCase() + this.config.fkField.slice(1);
    const raw = row[this.config.fkField] ?? row[camel];
    if (typeof raw === 'number') {
      return raw;
    }
    if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
      const id = (raw as Record<string, unknown>)['id'];
      return typeof id === 'number' ? id : null;
    }
    return null;
  }

  private catalogOptionLabel(item: Ref): string {
    return libelleOrId(item.libelle, item.id, `#${item.id ?? '?'}`);
  }

  private mapCatalog(body: unknown): Ref[] {
    return (unwrapListBody(body) as Record<string, unknown>[]).map((row) =>
      this.refFromCatalogRow(row),
    );
  }

  private refFromCatalogRow(row: Record<string, unknown>): Ref {
    const nested =
      row[this.config.catalogRefKey] ??
      row[this.config.catalogRefKey.charAt(0).toLowerCase() + this.config.catalogRefKey.slice(1)];
    if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
      return this.refFromCatalogRow(nested as Record<string, unknown>);
    }
    return {
      id: typeof row['id'] === 'number' ? row['id'] : null,
      libelle: this.pickCatalogText(row, 'libelle'),
      code: this.pickCatalogText(row, 'code'),
    };
  }

  private pickCatalogText(row: Record<string, unknown>, kind: 'libelle' | 'code'): string | null {
    const generic = row[kind];
    if (typeof generic === 'string' && generic.trim()) {
      return generic.trim();
    }
    for (const key of this.config.catalogLabelKeys) {
      const v = row[key];
      if (typeof v !== 'string' || !v.trim()) {
        continue;
      }
      const lower = key.toLowerCase();
      if (kind === 'libelle' && (lower.includes('libelle') || lower.includes('nom'))) {
        return v.trim();
      }
      if (kind === 'code' && lower.includes('code')) {
        return v.trim();
      }
    }
    return null;
  }

  private lineExtraChanged(
    before:
      | { extra: Record<string, string | number | null> }
      | undefined,
    after: AffectionLine,
  ): boolean {
    if (!before) {
      return true;
    }
    for (const field of this.config.extraFields ?? []) {
      if (before.extra[field.key] !== after.extra[field.key]) {
        return true;
      }
    }
    return false;
  }

  private serializeLines(): string {
    return JSON.stringify(
      this.lines.map((l) => ({
        lineKey: l.lineKey,
        checked: l.checked,
        liaisonId: l.liaisonId,
        extra: l.extra,
      })),
    );
  }

  private captureSnapshot(): void {
    this.snapshot = this.serializeLines();
  }
}
