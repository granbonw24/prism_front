import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import type { ContextChartPanel, ListStatsContext } from '@core/config/list-stats-context.types';
import { resolveColumnHeaderLabel } from '@core/config/referentiel-column-labels';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { formatHttpError } from '@core/utils/http-error.util';
import { ConfirmDeleteComponent } from '@shared/confirm-delete/confirm-delete.component';
import { MenaChartComponent } from '@shared/mena-chart/mena-chart.component';
import { AuthService } from '@services/auth.service';

/**
 * Paramètres pour les listes déroulantes « centre » (API paginée).
 * Plafonné comme côté serveur (PageableUtils.MAX_PAGE_SIZE = 2000).
 */
const CENTRE_OPTIONS_PAGE_PARAMS = { page: '0', size: '2000' };

@Component({
  selector: 'app-referentiel-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MenaChartComponent, ConfirmDeleteComponent],
  templateUrl: './referentiel-list-page.component.html',
  styleUrl: './referentiel-list-page.component.css',
})
export class ReferentielListPageComponent implements OnInit, OnDestroy, OnChanges {
  @Input() inputTitle?: string;
  /** Texte d’aide sous le titre (ex. périmètre métier Alpha uniquement). */
  @Input() inputSubtitle?: string;
  @Input() inputApiPath?: string;
  @Input() inputCreateFields?: ReferentielFormField[];
  @Input() addFormContextLabel?: string;
  @Input() addFormContextOptions?: Array<{ value: string; label: string }>;
  @Input() addFormContextValue?: string;
  @Output() addFormContextValueChange = new EventEmitter<string>();

  /**
   * Statistiques / filtres contextualisés (effectif : centres, périodes, années…).
   * Null = comportement liste simple (référentiel générique).
   */
  @Input() inputStatsContext: ListStatsContext | null = null;
  /**
   * Colonnes affichées dans le tableau (ordre conservé). Si absent, comportement par défaut
   * (échantillon des clés API, max 18). Les autres champs restent visibles dans le formulaire détail.
   */
  @Input() inputListColumnKeys?: string[];

  title = '';
  subtitle = '';
  apiPath = '';
  permissionFeature: string | null = null;
  workflowFeature: string | null = null;
  createFields: ReferentielFormField[] = [];
  /** Surcharges libellés colonnes (route `data.columnLabels`). */
  columnLabels: Record<string, string> = {};
  loading = false;
  errorMessage: string | null = null;
  rows: Record<string, unknown>[] = [];
  columns: string[] = [];
  lastSyncedAt: Date | null = null;
  successMessage: string | null = null;

  /** Filtre texte client sur les colonnes affichées */
  listFilter = '';
  listPageIndex = 0;
  listPageSize = 20;
  readonly listPageSizeOptions = [10, 20, 50, 100, 200];

  /** Filtres structurés (centre, période, année, niveau) */
  filterCentreId = '';
  filterSecondaryCentreId = '';
  filterPeriodeId = '';
  filterAnneeId = '';
  filterNiveauId = '';

  centreIdToLabel: Record<string, string> = {};
  centreIdToCodeType: Record<string, string> = {};
  secondaryCentreIdToLabel: Record<string, string> = {};
  centreFilterOptions: Array<{ value: string; label: string }> = [];
  secondaryCentreFilterOptions: Array<{ value: string; label: string }> = [];
  periodeIdToLabel: Record<string, string> = {};
  periodeFilterOptions: Array<{ value: string; label: string }> = [];
  anneeIdToLabel: Record<string, string> = {};
  anneeFilterOptions: Array<{ value: string; label: string }> = [];
  niveauIdToLabel: Record<string, string> = {};
  niveauFilterOptions: Array<{ value: string; label: string }> = [];

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
  workflowSubmittingId: string | number | null = null;
  fieldOptions: Record<string, Array<{ value: string | number; label: string }>> = {};

  /** Évite de relancer les GET d’options quand le cache est déjà rempli par l’API. */
  private readonly fieldOptionsApiLoaded = new Set<string>();
  /**
   * Libellés issus des objets référence de la ligne en édition (évite d’afficher un nu­mérique seul
   * avant/arrière chargement de la liste complète).
   */
  private optionSeeds: Record<string, { value: string | number; label: string }> = {};

  private dataSub?: Subscription;
  private loadSub?: Subscription;
  private statsLoadSub?: Subscription;
  private optionSubs: Subscription[] = [];
  /** Clés utilisées pour le filtre texte (toutes les colonnes « métier », pas seulement l’affichage). */
  private filterableKeys: string[] = [];
  private routeListColumnKeys?: string[];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnInit(): void {
    this.dataSub = this.route.data.subscribe((data) => {
      const routeTitle = (data['title'] as string) ?? 'Référentiel';
      const routeSubtitle = (data['subtitle'] as string) ?? '';
      const routeApiPath = (data['apiPath'] as string) ?? '';
      const routePermissionFeature = (data['permissionFeature'] as string | null | undefined) ?? null;
      const routeWorkflowFeature = (data['workflowFeature'] as string | null | undefined) ?? null;
      const routeCreateFields = (data['createFields'] as ReferentielFormField[]) ?? [];
      const routeColumnLabels = (data['columnLabels'] as Record<string, string>) ?? {};
      const routeListColumnKeys = (data['listColumnKeys'] as string[] | undefined) ?? undefined;
      this.title = this.inputTitle ?? routeTitle;
      this.subtitle = this.inputSubtitle ?? routeSubtitle;
      this.apiPath = this.inputApiPath ?? routeApiPath;
      this.permissionFeature = routePermissionFeature;
      this.workflowFeature = routeWorkflowFeature;
      this.createFields =
        this.inputCreateFields != null ? this.inputCreateFields : routeCreateFields;
      this.columnLabels = routeColumnLabels;
      this.routeListColumnKeys = routeListColumnKeys;
      this.fetch();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Toujours synchroniser les @Input (le 1er ngOnChanges a lieu avant ngOnInit / route.data).
    this.syncInputsFromParent();
    if (!this.dataSub) {
      return;
    }
    if (changes['inputStatsContext'] || changes['inputApiPath']) {
      this.clearStructuredFilters();
    }
    if (changes['inputCreateFields']) {
      this.fieldOptions = {};
      this.fieldOptionsApiLoaded.clear();
    }
    if (this.formModalOpen && this.formMode === 'create' && this.hasCreateForm) {
      this.recordForm = this.buildRecordForm();
      // Si le contexte (ex: type de centre) change dans la modal, recharge les listes liées.
      this.loadFieldOptions();
    }
    this.fetch();
  }

  /** Aligne titre, apiPath et champs formulaire sur les @Input du parent (composant imbriqué). */
  private syncInputsFromParent(): void {
    if (this.inputTitle != null) this.title = this.inputTitle;
    if (this.inputSubtitle != null) this.subtitle = this.inputSubtitle;
    if (this.inputApiPath != null) this.apiPath = this.inputApiPath;
    if (this.inputCreateFields != null) this.createFields = this.inputCreateFields;
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
    this.statsLoadSub?.unsubscribe();
    for (const s of this.optionSubs) s.unsubscribe();
  }

  get hasCreateForm(): boolean {
    return this.fieldsForForm.length > 0;
  }

  /** Champs formulaire hors clé technique `id` (réservée à la BD / URL). */
  get fieldsForForm(): ReferentielFormField[] {
    return this.createFields.filter((f) => f.key !== 'id');
  }

  /** Carte actifs / inactifs : uniquement si une colonne d’état booléenne est détectée. */
  get hasEtatStats(): boolean {
    return !this.loading && this.etatStatsColumn != null;
  }

  get hasStatsContext(): boolean {
    return this.inputStatsContext != null;
  }

  get hasActiveStructuredFilter(): boolean {
    return !!(
      this.filterCentreId ||
      this.filterSecondaryCentreId ||
      this.filterPeriodeId ||
      this.filterAnneeId ||
      this.filterNiveauId
    );
  }

  get hasActiveFilter(): boolean {
    return this.hasActiveStructuredFilter || !!this.listFilter?.trim();
  }

  get canGoPrevListPage(): boolean {
    return this.currentListPageIndex > 0;
  }

  get canGoNextListPage(): boolean {
    return this.currentListPageIndex < this.listPageCount - 1;
  }

  get filteredRows(): Record<string, unknown>[] {
    let list = this.rows;
    if (this.inputStatsContext) {
      list = list.filter((row) => this.rowPassesStructuredFilters(row));
    }
    const q = this.listFilter.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter((row) => this.rowMatchesFilter(row, q));
  }

  get filteredRowCount(): number {
    return this.filteredRows.length;
  }

  get listPageCount(): number {
    return Math.max(1, Math.ceil(this.filteredRowCount / this.listPageSize));
  }

  get currentListPageIndex(): number {
    return Math.min(Math.max(this.listPageIndex, 0), this.listPageCount - 1);
  }

  get listPageStart(): number {
    return this.filteredRowCount === 0 ? 0 : this.currentListPageIndex * this.listPageSize;
  }

  get listPageEnd(): number {
    return Math.min(this.listPageStart + this.listPageSize, this.filteredRowCount);
  }

  get pagedRows(): Record<string, unknown>[] {
    return this.filteredRows.slice(this.listPageStart, this.listPageEnd);
  }

  /** Graphiques (données filtrées = même périmètre que le tableau). */
  get contextChartPanels(): ContextChartPanel[] {
    const ctx = this.inputStatsContext;
    if (!ctx || this.loading || this.errorMessage) {
      return [];
    }
    const fr = this.filteredRows;
    if (!fr.length) {
      return [];
    }
    const panels: ContextChartPanel[] = [];
    const maxBar = 12;

    if (ctx.rowCentreIdKey && ctx.centresApiPath && Object.keys(this.centreIdToLabel).length) {
      const agg = this.aggregateByRowKey(fr, ctx.rowCentreIdKey, this.centreIdToLabel, 'Centre inconnu');
      if (agg.labels.length) {
        panels.push({
          title: `Enregistrements par centre (${ctx.scopeLabel})`,
          kind: 'bar',
          labels: agg.labels.slice(0, maxBar),
          data: agg.data.slice(0, maxBar),
        });
      }
      const typeMap = new Map<string, number>();
      for (const row of fr) {
        const centreIdVal: unknown = row[ctx.rowCentreIdKey!];
        const sid = this.scalarIdFromCell(centreIdVal);
        const ct = sid ? (this.centreIdToCodeType[sid] ?? '—') : '—';
        typeMap.set(ct, (typeMap.get(ct) ?? 0) + 1);
      }
      const typeEntries = [...typeMap.entries()].sort((a, b) => b[1] - a[1]);
      if (typeEntries.length) {
        panels.push({
          title: 'Répartition par code « type » de structure',
          kind: 'doughnut',
          labels: typeEntries.map((e) => e[0]),
          data: typeEntries.map((e) => e[1]),
        });
      }
    }

    if (
      panels.length < 3 &&
      ctx.rowPeriodeIdKey &&
      Object.keys(this.periodeIdToLabel).length &&
      this.columns.includes(ctx.rowPeriodeIdKey)
    ) {
      const agg = this.aggregateByRowKey(fr, ctx.rowPeriodeIdKey, this.periodeIdToLabel, 'Période inconnue');
      if (agg.labels.length) {
        panels.push({
          title: 'Répartition par période d’activité',
          kind: 'doughnut',
          labels: agg.labels,
          data: agg.data,
        });
      }
    }

    if (
      panels.length < 3 &&
      ctx.rowAnneeIdKey &&
      Object.keys(this.anneeIdToLabel).length &&
      this.columns.includes(ctx.rowAnneeIdKey)
    ) {
      const agg = this.aggregateByRowKey(fr, ctx.rowAnneeIdKey, this.anneeIdToLabel, 'Année inconnue');
      if (agg.labels.length) {
        panels.push({
          title: 'Enregistrements par année scolaire',
          kind: 'bar',
          labels: agg.labels,
          data: agg.data,
        });
      }
    }

    if (
      panels.length < 3 &&
      ctx.rowNiveauIdKey &&
      Object.keys(this.niveauIdToLabel).length &&
      this.columns.includes(ctx.rowNiveauIdKey)
    ) {
      const agg = this.aggregateByRowKey(fr, ctx.rowNiveauIdKey, this.niveauIdToLabel, 'Niveau inconnu');
      if (agg.labels.length) {
        panels.push({
          title: 'Enregistrements par niveau',
          kind: 'bar',
          labels: agg.labels,
          data: agg.data,
        });
      }
    }

    return panels.slice(0, 3);
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
    return !!this.apiPath && (this.canUpdateRecord || this.canDeleteRecord || this.hasWorkflow);
  }

  get canCreateRecord(): boolean {
    return this.hasPermission('CREER');
  }

  get canUpdateRecord(): boolean {
    return this.hasPermission('MODIFIER');
  }

  get canDeleteRecord(): boolean {
    return this.hasPermission('MODIFIER');
  }

  get hasWorkflow(): boolean {
    return !!this.workflowFeature;
  }

  workflowStatusLabel(row: Record<string, unknown>): string {
    if (this.bool(row['valideeCentrale'])) return 'Validé central';
    if (this.bool(row['valideeSuperviseur'])) return 'Validé superviseur';
    if (this.bool(row['valideeCoordonnateur'])) return 'Validé coordonnateur';
    return 'En attente coordonnateur';
  }

  workflowStatusClass(row: Record<string, unknown>): string {
    if (this.bool(row['valideeCentrale'])) return 'badge badge-success';
    if (this.bool(row['valideeSuperviseur'])) return 'badge badge-primary';
    if (this.bool(row['valideeCoordonnateur'])) return 'badge badge-info';
    return 'badge badge-secondary';
  }

  canValidateWorkflow(row: Record<string, unknown>): boolean {
    return this.nextWorkflowStep(row) !== null;
  }

  validateWorkflowRow(row: Record<string, unknown>): void {
    const id = this.resolveRowId(row);
    const step = this.nextWorkflowStep(row);
    if (!this.apiPath || id == null || step == null || this.workflowSubmittingId !== null) {
      return;
    }
    this.workflowSubmittingId = id;
    this.errorMessage = null;
    const url = `${this.apiBaseUrl}${this.apiPath}/${encodeURIComponent(String(id))}/${step}`;
    this.http.put<unknown>(url, {}).subscribe({
      next: () => {
        this.workflowSubmittingId = null;
        this.successMessage = 'Validation effectuée.';
        this.fetch();
      },
      error: (err: HttpErrorResponse) => {
        this.workflowSubmittingId = null;
        this.errorMessage = formatHttpError(err, 'Validation refusée.');
      },
    });
  }

  columnHeaderLabel(columnKey: string): string {
    return resolveColumnHeaderLabel(columnKey, this.columnLabels);
  }

  formatCell(value: unknown, columnKey?: string): string {
    if (value === null || value === undefined) {
      return '—';
    }
    const refLabel = this.tryFormatApiRef(value);
    if (refLabel != null) {
      return refLabel;
    }
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }
    if (typeof value === 'number' && this.columnLooksLikeBooleanFlag(columnKey)) {
      if (value === 1) {
        return 'Oui';
      }
      if (value === 0) {
        return 'Non';
      }
    }
    if (typeof value === 'string' && this.columnLooksLikeBooleanFlag(columnKey)) {
      const s = value.trim().toLowerCase();
      if (['true', '1', 'oui', 'yes'].includes(s)) {
        return 'Oui';
      }
      if (['false', '0', 'non', 'no'].includes(s)) {
        return 'Non';
      }
    }
    if (typeof value === 'string' && this.looksLikeIsoDate(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(d);
      }
    }
    if (typeof value === 'object') {
      const s = JSON.stringify(value);
      return s.length > 120 ? `${s.slice(0, 117)}…` : s;
    }
    return String(value);
  }

  /**
   * Objet référence API typique `{ id, code?, libelle? }` (format B) → libellé tableau / recherche.
   */
  private tryFormatApiRef(value: unknown): string | null {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }
    const o = value as Record<string, unknown>;
    if (!('id' in o)) {
      return null;
    }
    const parts: string[] = [];
    const code = o['code'];
    const libelle = o['libelle'];
    if (typeof code === 'string' && code.trim()) {
      parts.push(code.trim());
    }
    if (typeof libelle === 'string' && libelle.trim()) {
      parts.push(libelle.trim());
    }
    if (parts.length) {
      return parts.join(' — ');
    }
    const id = o['id'];
    if (typeof id === 'number' && Number.isFinite(id)) {
      return `#${id}`;
    }
    if (typeof id === 'string' && id.trim() !== '') {
      return `#${id.trim()}`;
    }
    return null;
  }

  /** Extrait un identifiant scalaire pour filtres / agrégations (ref `{ id }` ou nombre / chaîne). */
  private scalarIdFromCell(value: unknown): string {
    if (value == null || value === '') {
      return '';
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const o = value as Record<string, unknown>;
      const id = o['id'];
      if (typeof id === 'number' && Number.isFinite(id)) {
        return String(id);
      }
      if (typeof id === 'string' && id.trim() !== '') {
        return id.trim();
      }
    }
    return '';
  }

  getFieldOptions(field: ReferentielFormField): Array<{ value: string | number; label: string }> {
    if (field.options?.length) {
      return field.options;
    }
    return this.fieldOptions[this.optionsCacheKey(field)] ?? [];
  }

  clearListFilter(): void {
    this.listFilter = '';
    this.resetListPage();
  }

  clearStructuredFilters(): void {
    this.filterCentreId = '';
    this.filterSecondaryCentreId = '';
    this.filterPeriodeId = '';
    this.filterAnneeId = '';
    this.filterNiveauId = '';
    this.resetListPage();
  }

  clearAllListFilters(): void {
    this.clearListFilter();
    this.clearStructuredFilters();
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
    this.clearAllListFilters();
    this.fetch();
  }

  bool(value: unknown): boolean {
    return value === true || value === 1 || value === '1' || value === 'true';
  }

  resetListPage(): void {
    this.listPageIndex = 0;
  }

  onListPageSizeChange(): void {
    this.resetListPage();
  }

  goPrevListPage(): void {
    if (!this.canGoPrevListPage) {
      return;
    }
    this.listPageIndex = this.currentListPageIndex - 1;
  }

  goNextListPage(): void {
    if (!this.canGoNextListPage) {
      return;
    }
    this.listPageIndex = this.currentListPageIndex + 1;
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
    if (!this.canCreateRecord) {
      this.errorMessage = 'Vous n’avez pas la permission de créer cet enregistrement.';
      return;
    }
    this.formError = null;
    this.formMode = 'create';
    this.editingId = null;
    this.optionSeeds = {};
    this.syncInputsFromParent();
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
    if (!this.hasCreateForm || !this.canUpdateRecord || this.bool(row['valideeCoordonnateur'])) {
      return;
    }
    const id = this.resolveRowId(row);
    if (id == null) {
      return;
    }
    this.formError = null;
    this.formMode = 'edit';
    this.editingId = id;
    this.captureOptionSeedsFromRow(row);
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
    this.optionSeeds = {};
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
    if (!this.canDeleteRecord || this.bool(row['valideeCoordonnateur'])) {
      return;
    }
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
      if (v !== null && v !== undefined) {
        const s = this.formatCell(v, col).trim();
        if (s && s !== '—') {
          return s.length > 80 ? `${s.slice(0, 77)}…` : s;
        }
      }
    }
    return `#${id}`;
  }

  private hasPermission(permission: string): boolean {
    if (!this.permissionFeature) {
      return true;
    }
    return this.auth.hasPermission(`${this.permissionFeature}:${permission}`);
  }

  private nextWorkflowStep(row: Record<string, unknown>): string | null {
    if (!this.workflowFeature || !this.auth.hasPermission(`${this.workflowFeature}:VALIDER`)) {
      return null;
    }
    if (!this.bool(row['valideeCoordonnateur']) && this.hasValidatorRole(['COORDONNATEUR'])) {
      return 'valider-coordonnateur';
    }
    if (
      this.bool(row['valideeCoordonnateur']) &&
      !this.bool(row['valideeSuperviseur']) &&
      this.hasValidatorRole(['SUPERVISEUR'])
    ) {
      return 'valider-superviseur';
    }
    if (
      this.bool(row['valideeSuperviseur']) &&
      !this.bool(row['valideeCentrale']) &&
      this.hasValidatorRole(['SUPERVISEUR_AENF', 'DIRECTEUR'])
    ) {
      return 'valider-centrale';
    }
    return null;
  }

  private hasValidatorRole(roles: string[]): boolean {
    return this.auth.hasAnyRole([...roles, 'ADMIN', 'SUPER_ADMIN', 'SUPER_ROOT']);
  }

  private buildRecordForm(
    initial?: Record<string, unknown> | null,
  ): FormGroup {
    const controls: Record<string, unknown> = {};
    for (const f of this.fieldsForForm) {
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
      if (validators.length > 0) {
        controls[f.key] = [val, validators];
      } else {
        controls[f.key] = [val];
      }
    }
    return this.fb.group(controls);
  }

  /**
   * Valeur brute pour préremplir le formulaire : clé formulaire ou alias JSON enrichi (effectif, etc.).
   */
  private rowValueForFormField(row: Record<string, unknown>, fieldKey: string): unknown {
    const direct = row[fieldKey];
    if (direct !== undefined && direct !== null) {
      return direct;
    }
    const fallbacks: Record<string, string[]> = {
      idCentre: ['Alpha', 'Centre', 'alpha', 'centre'],
      idPeriodeActivite: ['PeriodeActivite', 'periodeActivite'],
      idNiveauAlpha: ['NiveauAlpha', 'niveauAlpha'],
      idNiveauCp: ['NiveauCp', 'niveauCp'],
      idNiveauSie: ['NiveauSie', 'niveauSie'],
      idAnneeScolaire: ['AnneeScolaire', 'anneeScolaire'],
      idRegion: ['Region', 'region'],
      idDrena: ['Drena', 'drena'],
      idDepartement: ['Departement', 'departement'],
      idSousPrefecture: ['SousPrefecture', 'sousPrefecture'],
      idMilieuImplentation: ['MilieuImplantation', 'milieuImplantation'],
      idCommune: ['Commune', 'commune'],
      codeRegion: ['code'],
      libelleRegion: ['libelle'],
      codeDrena: ['code'],
      nomDrena: ['libelle'],
      codeDepartement: ['code'],
      nomDepartement: ['libelle'],
      codeCommune: ['code'],
      nomCommune: ['libelle'],
    };
    for (const alt of fallbacks[fieldKey] ?? []) {
      const v = row[alt];
      if (v !== undefined && v !== null) {
        return v;
      }
    }
    return direct;
  }

  private rowToFormValues(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const f of this.fieldsForForm) {
      let v = this.rowValueForFormField(row, f.key);
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
          out[f.key] = Number.isNaN(n) ? v : n;
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
    for (const f of this.fieldsForForm) {
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
        } else if (f.type === 'select') {
          out[f.key] = f.payloadAsObjectId ? { id: v } : v;
        }
      } else {
        out[f.key] = v;
      }
    }
    return out;
  }

  private rowPassesStructuredFilters(row: Record<string, unknown>): boolean {
    const ctx = this.inputStatsContext;
    if (!ctx) {
      return true;
    }
    if (ctx.rowCentreIdKey && this.filterCentreId) {
      if (this.scalarIdFromCell(row[ctx.rowCentreIdKey]) !== this.filterCentreId) {
        return false;
      }
    }
    if (ctx.secondaryRowCentreIdKey && this.filterSecondaryCentreId) {
      if (this.scalarIdFromCell(row[ctx.secondaryRowCentreIdKey]) !== this.filterSecondaryCentreId) {
        return false;
      }
    }
    if (ctx.rowPeriodeIdKey && this.filterPeriodeId) {
      if (this.scalarIdFromCell(row[ctx.rowPeriodeIdKey]) !== this.filterPeriodeId) {
        return false;
      }
    }
    if (ctx.rowAnneeIdKey && this.filterAnneeId) {
      if (this.scalarIdFromCell(row[ctx.rowAnneeIdKey]) !== this.filterAnneeId) {
        return false;
      }
    }
    if (ctx.rowNiveauIdKey && this.filterNiveauId) {
      if (this.scalarIdFromCell(row[ctx.rowNiveauIdKey]) !== this.filterNiveauId) {
        return false;
      }
    }
    return true;
  }

  private aggregateByRowKey(
    rows: Record<string, unknown>[],
    rowKey: string,
    labelById: Record<string, string>,
    unknownLabel: string,
  ): { labels: string[]; data: number[] } {
    const map = new Map<string, number>();
    for (const row of rows) {
      const cellVal: unknown = row[rowKey];
      const sid = this.scalarIdFromCell(cellVal);
      const label = sid ? (labelById[sid] ?? `Id ${sid}`) : unknownLabel;
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    const entries = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map((e) => e[0]),
      data: entries.map((e) => e[1]),
    };
  }

  private buildOptionsFromMap(m: Record<string, string>): Array<{ value: string; label: string }> {
    return Object.entries(m)
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  }

  private ingestRefList(
    rows: unknown,
    valueKey: string,
    labelKeys: string[],
    target: Record<string, string>,
  ): void {
    const list = unwrapListBody(rows);
    for (const raw of list) {
      const row = raw as Record<string, unknown>;
      const idRaw = row[valueKey];
      if (typeof idRaw !== 'number' && typeof idRaw !== 'string') {
        continue;
      }
      const sid = String(idRaw);
      const parts: string[] = [];
      for (const k of labelKeys) {
        const v = row[k];
        if (v == null) {
          continue;
        }
        const s = String(v).trim();
        if (s) {
          parts.push(s);
        }
      }
      target[sid] = parts.length ? parts.join(' · ') : sid;
    }
  }

  private ingestCentreList(rows: unknown, ctx: ListStatsContext): void {
    const list = unwrapListBody(rows);
    const vk = ctx.centreOptionValueKey ?? 'id';
    const lks = ctx.centreOptionLabelKeys ?? ['libelle', 'nom', 'code'];
    for (const raw of list) {
      const row = raw as Record<string, unknown>;
      const idRaw = row[vk];
      if (typeof idRaw !== 'number' && typeof idRaw !== 'string') {
        continue;
      }
      const sid = String(idRaw);
      const parts: string[] = [];
      for (const k of lks) {
        const v = row[k];
        if (v == null) {
          continue;
        }
        const s = String(v).trim();
        if (s) {
          parts.push(s);
        }
      }
      this.centreIdToLabel[sid] = parts.length ? parts.join(' · ') : sid;
      const ct = row['codeType'];
      this.centreIdToCodeType[sid] =
        ct != null && String(ct).trim() !== '' ? String(ct).trim() : '—';
    }
    this.centreFilterOptions = this.buildOptionsFromMap(this.centreIdToLabel);
  }

  private ingestSecondaryCentreList(rows: unknown, ctx: ListStatsContext): void {
    const list = unwrapListBody(rows);
    const vk = ctx.centreOptionValueKey ?? 'id';
    const lks = ctx.centreOptionLabelKeys ?? ['libelle', 'nom', 'code'];
    for (const raw of list) {
      const row = raw as Record<string, unknown>;
      const idRaw = row[vk];
      if (typeof idRaw !== 'number' && typeof idRaw !== 'string') {
        continue;
      }
      const sid = String(idRaw);
      const parts: string[] = [];
      for (const k of lks) {
        const v = row[k];
        if (v == null) {
          continue;
        }
        const s = String(v).trim();
        if (s) {
          parts.push(s);
        }
      }
      this.secondaryCentreIdToLabel[sid] = parts.length ? parts.join(' · ') : sid;
    }
    this.secondaryCentreFilterOptions = this.buildOptionsFromMap(this.secondaryCentreIdToLabel);
  }

  private loadStatsReferenceData(): void {
    this.statsLoadSub?.unsubscribe();
    this.centreIdToLabel = {};
    this.centreIdToCodeType = {};
    this.secondaryCentreIdToLabel = {};
    this.centreFilterOptions = [];
    this.secondaryCentreFilterOptions = [];
    this.periodeIdToLabel = {};
    this.periodeFilterOptions = [];
    this.anneeIdToLabel = {};
    this.anneeFilterOptions = [];
    this.niveauIdToLabel = {};
    this.niveauFilterOptions = [];

    const ctx = this.inputStatsContext;
    if (!ctx) {
      return;
    }

    const req: Record<string, ReturnType<HttpClient['get']>> = {};
    if (ctx.centresApiPath) {
      req['centres'] = this.http.get<unknown>(`${this.apiBaseUrl}${ctx.centresApiPath}`, {
        params: CENTRE_OPTIONS_PAGE_PARAMS,
      });
    }
    const secPath = ctx.secondaryCentresApiPath;
    const secSeparate =
      !!ctx.secondaryRowCentreIdKey &&
      !!secPath &&
      secPath !== ctx.centresApiPath;
    if (secSeparate) {
      req['centres2'] = this.http.get<unknown>(`${this.apiBaseUrl}${secPath}`, {
        params: CENTRE_OPTIONS_PAGE_PARAMS,
      });
    }
    if (ctx.periodesApiPath) {
      req['periodes'] = this.http.get<unknown[]>(`${this.apiBaseUrl}${ctx.periodesApiPath}`);
    }
    if (ctx.anneesApiPath) {
      req['annees'] = this.http.get<unknown[]>(`${this.apiBaseUrl}${ctx.anneesApiPath}`);
    }
    if (ctx.niveauxApiPath) {
      req['niveaux'] = this.http.get<unknown[]>(`${this.apiBaseUrl}${ctx.niveauxApiPath}`);
    }

    if (!Object.keys(req).length) {
      return;
    }

    this.statsLoadSub = forkJoin(req).subscribe({
      next: (res: Record<string, unknown>) => {
        if (res['centres']) {
          this.ingestCentreList(res['centres'], ctx);
        }
        if (res['centres2']) {
          this.ingestSecondaryCentreList(res['centres2'], ctx);
        } else if (ctx.secondaryRowCentreIdKey) {
          this.secondaryCentreIdToLabel = { ...this.centreIdToLabel };
          this.secondaryCentreFilterOptions = [...this.centreFilterOptions];
        }
        if (res['periodes']) {
          this.ingestRefList(
            res['periodes'],
            ctx.periodeOptionValueKey ?? 'id',
            ctx.periodeOptionLabelKeys ?? ['libellePeriodeActivite', 'codePeriodeActivite', 'libelle'],
            this.periodeIdToLabel,
          );
          this.periodeFilterOptions = this.buildOptionsFromMap(this.periodeIdToLabel);
        }
        if (res['annees']) {
          this.ingestRefList(
            res['annees'],
            ctx.anneeOptionValueKey ?? 'id',
            ctx.anneeOptionLabelKeys ?? ['debutAnneeScolaire', 'finAnneeScolaire'],
            this.anneeIdToLabel,
          );
          this.anneeFilterOptions = this.buildOptionsFromMap(this.anneeIdToLabel);
        }
        if (res['niveaux']) {
          this.ingestRefList(
            res['niveaux'],
            ctx.niveauOptionValueKey ?? 'id',
            ctx.niveauOptionLabelKeys ?? ['libelleNiveauSie', 'libelleNiveauCp', 'libelle'],
            this.niveauIdToLabel,
          );
          this.niveauFilterOptions = this.buildOptionsFromMap(this.niveauIdToLabel);
        }
        /** Évite un 2ᵉ GET (ex. `/api/alpha`) pour les mêmes options que les filtres / graphiques. */
        this.hydrateSelectOptionsFromStatsData(ctx);
      },
      error: () => {
        /* silencieux : les graphiques resteront vides */
      },
    });
  }

  /**
   * Préremplit les listes déroulantes du formulaire à partir des réponses déjà chargées pour les
   * filtres statistiques, pour ne pas doubler les requêtes (limite ~6 connexions HTTP/1.1 par origine).
   */
  private hydrateSelectOptionsFromStatsData(ctx: ListStatsContext): void {
    for (const field of this.fieldsForForm) {
      if (field.type !== 'select' || !field.optionsApiPath) {
        continue;
      }
      const cacheKey = this.optionsCacheKey(field);
      if (this.fieldOptionsApiLoaded.has(cacheKey)) {
        continue;
      }
      const path = field.optionsApiPath;
      let source: Array<{ value: string; label: string }> | null = null;
      if (ctx.centresApiPath === path && this.centreFilterOptions.length) {
        source = this.centreFilterOptions;
      } else if (
        ctx.secondaryCentresApiPath != null &&
        ctx.secondaryCentresApiPath === path &&
        this.secondaryCentreFilterOptions.length
      ) {
        source = this.secondaryCentreFilterOptions;
      } else if (ctx.periodesApiPath === path && this.periodeFilterOptions.length) {
        source = this.periodeFilterOptions;
      } else if (ctx.anneesApiPath === path && this.anneeFilterOptions.length) {
        source = this.anneeFilterOptions;
      } else if (ctx.niveauxApiPath === path && this.niveauFilterOptions.length) {
        source = this.niveauFilterOptions;
      }
      if (source) {
        this.fieldOptions[cacheKey] = source.map((o) => ({
          value: this.coerceSelectOptionId(o.value),
          label: o.label,
        }));
        this.fieldOptionsApiLoaded.add(cacheKey);
      }
    }
  }

  private coerceSelectOptionId(raw: string): string | number {
    const n = Number(raw);
    if (Number.isFinite(n) && raw.trim() !== '' && String(n) === raw.trim()) {
      return n;
    }
    return raw;
  }

  private rowMatchesFilter(row: Record<string, unknown>, q: string): boolean {
    const id = this.resolveRowId(row);
    if (id != null && String(id).toLowerCase().includes(q)) {
      return true;
    }
    const keys = this.filterableKeys.length ? this.filterableKeys : this.columns;
    for (const col of keys) {
      if (this.formatCell(row[col], col).toLowerCase().includes(q)) {
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
        const list = unwrapListBody(body);
        this.rows = list as Record<string, unknown>[];
        this.buildColumns();
        this.detectEtatColumn();
        this.lastSyncedAt = new Date();
        this.loading = false;
        this.loadStatsReferenceData();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = formatHttpError(
          err,
          'Impossible de charger les données (réseau, CORS, session ou erreur serveur).',
        );
        this.loading = false;
        this.rows = [];
        this.columns = [];
        this.filterableKeys = [];
        this.etatStatsColumn = null;
      },
    });
  }

  private buildColumns(): void {
    if (!this.rows.length) {
      this.columns = [];
      this.filterableKeys = [];
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
    this.filterableKeys = visibleKeys;

    const preferred = this.inputListColumnKeys ?? this.routeListColumnKeys;
    if (preferred != null && preferred.length > 0) {
      this.columns = preferred.filter((k) => k in first);
      return;
    }
    this.columns = visibleKeys.slice(0, 18);
  }

  private columnLooksLikeBooleanFlag(columnKey: string | undefined): boolean {
    if (!columnKey) {
      return false;
    }
    return (
      /etat/i.test(columnKey) ||
      /^(actif|active|enabled)$/i.test(columnKey) ||
      /actif$/i.test(columnKey)
    );
  }

  private looksLikeIsoDate(s: string): boolean {
    return /^\d{4}-\d{2}-\d{2}/.test(s.trim());
  }

  private loadFieldOptions(): void {
    for (const field of this.fieldsForForm) {
      if (field.type !== 'select' || field.options?.length || !field.optionsApiPath) continue;
      const cacheKey = this.optionsCacheKey(field);
      if (this.fieldOptionsApiLoaded.has(cacheKey)) {
        this.mergeSeedIntoFieldOptions(cacheKey);
        continue;
      }
      const centreOptionsPaths = new Set(['/api/alpha', '/api/cec', '/api/cp', '/api/sie']);
      const optPath = field.optionsApiPath ?? '';
      const sub = this.http
        .get<unknown>(`${this.apiBaseUrl}${optPath}`, {
          params: centreOptionsPaths.has(optPath) ? CENTRE_OPTIONS_PAGE_PARAMS : undefined,
        })
        .subscribe({
        next: (rows) => {
          const list = unwrapListBody(rows);
          let built = list
            .map((row) => this.toOption(field, row as Record<string, unknown>))
            .filter((x): x is { value: string | number; label: string } => x != null);
          built = this.mergeSeedIntoOptionsList(cacheKey, built);
          this.fieldOptions[cacheKey] = built;
          this.fieldOptionsApiLoaded.add(cacheKey);
        },
        error: () => {
          const seedOnly = this.optionSeeds[cacheKey] ? [this.optionSeeds[cacheKey]] : [];
          this.fieldOptions[cacheKey] = seedOnly;
          this.fieldOptionsApiLoaded.add(cacheKey);
        },
      });
      this.optionSubs.push(sub);
    }
    for (const field of this.fieldsForForm) {
      if (field.type !== 'select' || field.options?.length || !field.optionsApiPath) continue;
      const cacheKey = this.optionsCacheKey(field);
      if (!this.fieldOptionsApiLoaded.has(cacheKey) && this.optionSeeds[cacheKey]) {
        this.fieldOptions[cacheKey] = [this.optionSeeds[cacheKey]];
      }
    }
  }

  private optionsCacheKey(field: ReferentielFormField): string {
    return `${field.key}::${field.optionsApiPath ?? ''}`;
  }

  private toOption(field: ReferentielFormField, row: Record<string, unknown>): { value: string | number; label: string } | null {
    const valueKey = field.optionValueKey ?? 'id';
    let valueRaw: unknown = row[valueKey];
    if (valueRaw == null && 'id' in row) {
      valueRaw = row['id'];
    }
    if (valueRaw != null && typeof valueRaw === 'object' && !Array.isArray(valueRaw)) {
      const nid = (valueRaw as Record<string, unknown>)['id'];
      if (typeof nid === 'number' || typeof nid === 'string') {
        valueRaw = nid;
      }
    }
    if (typeof valueRaw !== 'string' && typeof valueRaw !== 'number') return null;

    const labelKeys = field.optionLabelKeys ?? ['libelle', 'nom', 'label', 'code', 'id'];
    const parts: string[] = [];
    for (const k of labelKeys) {
      const v = row[k];
      if (v == null) continue;
      const s = String(v).trim();
      if (s) parts.push(s);
    }
    if (parts.length === 0) {
      for (const k of ['libelle', 'code', 'label', 'nom']) {
        const v = row[k];
        if (v != null && String(v).trim()) {
          parts.push(String(v).trim());
        }
      }
    }
    return {
      value: valueRaw,
      label: parts.length ? parts.join(' — ') : String(valueRaw),
    };
  }

  private captureOptionSeedsFromRow(row: Record<string, unknown>): void {
    this.optionSeeds = {};
    for (const f of this.fieldsForForm) {
      if (f.type !== 'select') continue;
      const cacheKey = this.optionsCacheKey(f);
      const raw = this.rowValueForFormField(row, f.key);
      if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
        const opt = this.toOption(f, raw as Record<string, unknown>);
        if (opt) {
          this.optionSeeds[cacheKey] = opt;
        }
      }
    }
  }

  private mergeSeedIntoOptionsList(
    cacheKey: string,
    list: Array<{ value: string | number; label: string }>,
  ): Array<{ value: string | number; label: string }> {
    const seed = this.optionSeeds[cacheKey];
    if (!seed) {
      return list;
    }
    if (list.some((x) => String(x.value) === String(seed.value))) {
      return list;
    }
    return [seed, ...list];
  }

  private mergeSeedIntoFieldOptions(cacheKey: string): void {
    const seed = this.optionSeeds[cacheKey];
    if (!seed) {
      return;
    }
    const cur = this.fieldOptions[cacheKey] ?? [];
    if (cur.some((x) => String(x.value) === String(seed.value))) {
      return;
    }
    this.fieldOptions[cacheKey] = [seed, ...cur];
  }
}
