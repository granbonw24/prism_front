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
import { Subscription } from 'rxjs';
import type { ReferentielFormField } from '@core/config/referentiel-form.types';
import { filterVisibleListColumns } from '@core/config/list-column-visibility';
import { resolveColumnHeaderLabel } from '@core/config/referentiel-column-labels';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { formatHttpError } from '@core/utils/http-error.util';
import { ConfirmDeleteComponent } from '@shared/confirm-delete/confirm-delete.component';
import { MenaRowActionButtonComponent } from '@shared/mena-row-action-button/mena-row-action-button.component';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import {
  sortByLabel,
  toMenaSelectOptionsFromPairs,
} from '@shared/mena-searchable-select/mena-select-options.util';
import { AuthService } from '@services/auth.service';
import type { MenuContextDashboardModule } from '@models/context-dashboard';
import { MenaContextDashboardComponent } from '@shared/mena-context-dashboard/mena-context-dashboard.component';
import {
  MenaRecordDetailField,
  MenaRecordDetailModalComponent,
} from '@shared/mena-record-detail-modal/mena-record-detail-modal.component';
import { MenaWorkflowQueueToolbarComponent } from '@shared/mena-workflow-queue-toolbar/mena-workflow-queue-toolbar.component';
import {
  collectConseillerFilterOptions,
  readWorkflowQueueTab,
  resolveRowCentreId,
  resolveRowConseillerLogin,
  rowMatchesWorkflowTab,
  type WorkflowQueueTab,
} from '@core/workflow/workflow-queue.util';

/**
 * Paramètres pour les listes déroulantes « centre » (API paginée).
 * Plafonné comme côté serveur (PageableUtils.MAX_PAGE_SIZE = 2000).
 */
const CENTRE_OPTIONS_PAGE_PARAMS = { page: '0', size: '2000' };

type WorkflowStatus =
  | 'BROUILLON'
  | 'SOUMIS'
  | 'VALIDEE_COORDONNATEUR'
  | 'VALIDEE_SUPERVISEUR'
  | 'VALIDEE_CENTRALE'
  | 'REJETE'
  | 'RETOURNE';

type WorkflowDecisionAction = 'rejeter' | 'retourner';

@Component({
  selector: 'app-referentiel-list-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ConfirmDeleteComponent,
    MenaRowActionButtonComponent,
    MenaSearchableSelectComponent,
    MenaContextDashboardComponent,
    MenaRecordDetailModalComponent,
    MenaWorkflowQueueToolbarComponent,
  ],
  templateUrl: './referentiel-list-page.component.html',
  styleUrl: './referentiel-list-page.component.css',
})
export class ReferentielListPageComponent implements OnInit, OnDestroy, OnChanges {
  @Input() inputTitle?: string;
  /** Texte d’aide sous le titre (ex. périmètre métier Alpha uniquement). */
  @Input() inputSubtitle?: string;
  @Input() inputApiPath?: string;
  @Input() inputPermissionFeature?: string | null;
  @Input() inputWorkflowFeature?: string | null;
  @Input() inputCreateFields?: ReferentielFormField[];
  @Input() addFormContextLabel?: string;
  @Input() addFormContextOptions?: Array<{ value: string; label: string }>;
  @Input() addFormContextValue?: string;
  @Output() addFormContextValueChange = new EventEmitter<string>();

  /**
   * Colonnes affichées dans le tableau (ordre conservé). Si absent, comportement par défaut
   * (échantillon des clés API, max 18). Les autres champs restent visibles dans le formulaire détail.
   */
  @Input() inputListColumnKeys?: string[];
  /**
   * Formulaire modal « effectif » : champs non numériques en 2 colonnes, effectifs en 3 colonnes
   * avec zone interne défilante (voir menus Apprenant / effectif centre).
   */
  @Input() inputEffectifDenseForm = false;
  /** Menus multi-types (Alpha / CEC / CP / SIE) : sélecteur « Type de centre » visible dans la page. */
  @Input() inputShowToolbarCentreTypeFilter = false;
  /** Module métier pour le mini tableau de bord contextuel (API). */
  @Input() inputContextDashboardModule?: MenuContextDashboardModule;
  @Input() inputContextDashboardSubModule?: string;
  @Input() inputContextDashboardAlwaysVisible = false;
  /** Type de centre forcé (ex. passage Alpha uniquement). */
  @Input() inputContextDashboardCentreType?: string;

  title = '';
  subtitle = '';
  apiPath = '';
  permissionFeature: string | null = null;
  workflowFeature: string | null = null;
  createFields: ReferentielFormField[] = [];
  contextDashboardModule: MenuContextDashboardModule | null = null;
  contextDashboardSubModule = '';
  contextDashboardAlwaysVisible = false;
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
  workflowQueueTab: WorkflowQueueTab = 'ACTION';
  workflowFilterCentreId: number | '' = '';
  workflowFilterConseiller = '';
  listPageIndex = 0;
  listPageSize = 20;
  readonly listPageSizeOptions = [10, 20, 50, 100, 200];

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
  workflowDecisionOpen = false;
  workflowDecisionAction: WorkflowDecisionAction | null = null;
  workflowDecisionTarget: Record<string, unknown> | null = null;
  workflowDecisionText = '';
  workflowDecisionError: string | null = null;
  detailModalOpen = false;
  detailLoading = false;
  detailFields: MenaRecordDetailField[] = [];
  detailSubtitle = '';
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
  private optionSubs: Subscription[] = [];
  /** Clés utilisées pour le filtre texte (toutes les colonnes « métier », pas seulement l’affichage). */
  private filterableKeys: string[] = [];
  private routeListColumnKeys?: string[];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly fb: FormBuilder,
    readonly auth: AuthService,
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
      const routeDashModule = (data['contextDashboardModule'] as MenuContextDashboardModule | undefined) ?? undefined;
      const routeDashSub = (data['contextDashboardSubModule'] as string | undefined) ?? '';
      const routeDashAlways = (data['contextDashboardAlwaysVisible'] as boolean | undefined) ?? false;
      this.title = this.inputTitle ?? routeTitle;
      this.subtitle = this.inputSubtitle ?? routeSubtitle;
      this.apiPath = this.inputApiPath ?? routeApiPath;
      this.permissionFeature = this.inputPermissionFeature ?? routePermissionFeature;
      this.workflowFeature = this.inputWorkflowFeature ?? routeWorkflowFeature;
      this.createFields =
        this.inputCreateFields != null ? this.inputCreateFields : routeCreateFields;
      this.columnLabels = routeColumnLabels;
      this.routeListColumnKeys = routeListColumnKeys;
      this.syncContextDashboardConfig(routeDashModule, routeDashSub, routeDashAlways);
      this.fetch();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Toujours synchroniser les @Input (le 1er ngOnChanges a lieu avant ngOnInit / route.data).
    this.syncInputsFromParent();
    if (!this.dataSub) {
      return;
    }
    if (changes['inputApiPath']) {
      this.clearListFilter();
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
    if (this.inputPermissionFeature !== undefined) this.permissionFeature = this.inputPermissionFeature;
    if (this.inputWorkflowFeature !== undefined) this.workflowFeature = this.inputWorkflowFeature;
    if (this.inputCreateFields != null) this.createFields = this.inputCreateFields;
    this.syncContextDashboardConfig();
  }

  private syncContextDashboardConfig(
    routeModule?: MenuContextDashboardModule,
    routeSubModule?: string,
    routeAlwaysVisible?: boolean,
  ): void {
    const mod = this.inputContextDashboardModule ?? routeModule ?? null;
    this.contextDashboardModule = mod ?? null;
    this.contextDashboardSubModule =
      this.inputContextDashboardSubModule ?? routeSubModule ?? '';
    this.contextDashboardAlwaysVisible =
      this.inputContextDashboardAlwaysVisible || (routeAlwaysVisible ?? false);
  }

  contextCentreTypeForDash(): string | undefined {
    const forced = (this.inputContextDashboardCentreType ?? '').trim();
    if (forced) {
      return forced.toUpperCase();
    }
    if (!this.inputShowToolbarCentreTypeFilter) {
      return undefined;
    }
    const v = (this.addFormContextValue ?? '').trim().toLowerCase();
    if (!v) {
      return undefined;
    }
    const map: Record<string, string> = {
      alpha: 'ALPHA',
      cec: 'CEC',
      cp: 'CP',
      sie: 'SIE',
    };
    return map[v] ?? v.toUpperCase();
  }

  onAddFormContextChange(ev: Event): void {
    const target = ev.target as HTMLSelectElement | null;
    const v = String(target?.value ?? '').trim();
    if (!v) return;
    this.addFormContextValueChange.emit(v);
  }

  onAddFormContextValueChange(value: string | number | boolean | null): void {
    const v = String(value ?? '').trim();
    if (!v) return;
    this.addFormContextValueChange.emit(v);
  }

  menaContextOptions() {
    return toMenaSelectOptionsFromPairs(this.addFormContextOptions ?? []);
  }

  menaFieldOptions(field: ReferentielFormField) {
    return toMenaSelectOptionsFromPairs(this.getFieldOptions(field));
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.loadSub?.unsubscribe();
    for (const s of this.optionSubs) s.unsubscribe();
  }

  get hasCreateForm(): boolean {
    return this.fieldsForForm.length > 0;
  }

  /** Champs formulaire hors clé technique `id` (réservée à la BD / URL). */
  get fieldsForForm(): ReferentielFormField[] {
    return this.createFields.filter((f) => f.key !== 'id');
  }

  /** Mise en page dense effectif : tout sauf les compteurs numériques. */
  get formFieldsNonNumeric(): ReferentielFormField[] {
    return this.fieldsForForm.filter((f) => f.type !== 'number');
  }

  /** Mise en page dense effectif : uniquement les champs numériques (grille 3 colonnes). */
  get formFieldsNumeric(): ReferentielFormField[] {
    return this.fieldsForForm.filter((f) => f.type === 'number');
  }

  /** Carte actifs / inactifs : uniquement si une colonne d’état booléenne est détectée. */
  get hasEtatStats(): boolean {
    return !this.loading && this.etatStatsColumn != null;
  }

  get hasActiveFilter(): boolean {
    return (
      !!this.listFilter?.trim() ||
      this.workflowFilterCentreId !== '' ||
      !!this.workflowFilterConseiller
    );
  }

  get workflowCentreFilterOptions(): Array<{ value: number | ''; label: string }> {
    const map = new Map<number, string>();
    for (const row of this.rows) {
      const id = resolveRowCentreId(row);
      if (id == null) {
        continue;
      }
      const alpha = row['alpha'] as { code?: string; libelle?: string } | null | undefined;
      const label =
        [alpha?.code, alpha?.libelle].filter(Boolean).join(' — ') || `Centre #${id}`;
      map.set(id, label);
    }
    return [
      { value: '' as const, label: 'Tous les centres' },
      ...[...map.entries()]
        .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
        .map(([value, label]) => ({ value, label })),
    ];
  }

  get workflowConseillerFilterOptions() {
    return collectConseillerFilterOptions(this.rows);
  }

  get canGoPrevListPage(): boolean {
    return this.currentListPageIndex > 0;
  }

  get canGoNextListPage(): boolean {
    return this.currentListPageIndex < this.listPageCount - 1;
  }

  get filteredRows(): Record<string, unknown>[] {
    let base = this.rows;
    if (this.hasWorkflow) {
      base = base.filter((row) => {
        const tab = readWorkflowQueueTab(row);
        if (!tab) {
          return true;
        }
        return rowMatchesWorkflowTab(row, this.workflowQueueTab);
      });
      if (this.workflowFilterCentreId !== '') {
        const centreId = Number(this.workflowFilterCentreId);
        base = base.filter((row) => resolveRowCentreId(row) === centreId);
      }
      if (this.workflowFilterConseiller) {
        const c = this.workflowFilterConseiller;
        base = base.filter((row) => resolveRowConseillerLogin(row) === c);
      }
    }
    const q = this.listFilter.trim().toLowerCase();
    if (!q) {
      return base;
    }
    return base.filter((row) => this.rowMatchesFilter(row, q));
  }

  onWorkflowQueueTabChange(tab: WorkflowQueueTab): void {
    this.workflowQueueTab = tab;
    this.resetListPage();
  }

  clearWorkflowQueueFilters(): void {
    this.workflowFilterCentreId = '';
    this.workflowFilterConseiller = '';
    this.resetListPage();
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

  get detailModalTitle(): string {
    return 'Détails de l’enregistrement';
  }

  get formModalTitle(): string {
    if (!this.hasCreateForm) {
      return this.formMode === 'edit' ? 'Modifier' : 'Ajout';
    }
    return this.formMode === 'edit'
      ? 'Modifier l’enregistrement'
      : 'Nouvel enregistrement';
  }

  /** Colonne Actions : au minimum le bouton Détails. */
  get showActionsColumn(): boolean {
    return !!this.apiPath;
  }

  get canUseRowActions(): boolean {
    return this.showActionsColumn && (this.canUpdateRecord || this.canDeleteRecord || this.hasWorkflow);
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
    const genericStatus = this.workflowStatus(row);
    if (genericStatus) {
      return this.workflowStatusText(genericStatus);
    }
    if (this.bool(row['valideeCentrale'])) return 'Validé central';
    if (this.bool(row['valideeSuperviseur'])) return 'Validé superviseur';
    if (this.bool(row['valideeCoordonnateur'])) return 'Validé coordonnateur';
    return 'Brouillon';
  }

  workflowStatusClass(row: Record<string, unknown>): string {
    const genericStatus = this.workflowStatus(row);
    if (genericStatus === 'VALIDEE_CENTRALE') return 'badge badge-success';
    if (genericStatus === 'VALIDEE_SUPERVISEUR') return 'badge badge-primary';
    if (genericStatus === 'VALIDEE_COORDONNATEUR') return 'badge badge-info';
    if (genericStatus === 'SOUMIS') return 'badge badge-warning';
    if (genericStatus === 'REJETE') return 'badge badge-danger';
    if (genericStatus === 'RETOURNE') return 'badge badge-secondary';
    if (this.bool(row['valideeCentrale'])) return 'badge badge-success';
    if (this.bool(row['valideeSuperviseur'])) return 'badge badge-primary';
    if (this.bool(row['valideeCoordonnateur'])) return 'badge badge-info';
    return 'badge badge-secondary';
  }

  workflowTooltip(row: Record<string, unknown>): string {
    const motif = String(row['workflowMotifRejet'] ?? '').trim();
    if (motif) {
      return `Motif rejet : ${motif}`;
    }
    const commentaire = String(row['workflowCommentaireRetour'] ?? '').trim();
    if (commentaire) {
      return `Commentaire retour : ${commentaire}`;
    }
    return this.workflowStatusLabel(row);
  }

  canSubmitWorkflow(row: Record<string, unknown>): boolean {
    if (!this.hasWorkflow || !this.canUpdateRecord || this.workflowSubmittingId !== null) {
      return false;
    }
    const id = this.resolveRowId(row);
    if (id == null) {
      return false;
    }
    const status = this.workflowStatus(row);
    return status === null || status === 'BROUILLON' || status === 'RETOURNE';
  }

  canValidateWorkflow(row: Record<string, unknown>): boolean {
    return this.nextWorkflowStatus(row) !== null && this.workflowSubmittingId === null;
  }

  canRejectOrReturnWorkflow(row: Record<string, unknown>): boolean {
    return this.nextWorkflowStatus(row) !== null && this.workflowSubmittingId === null;
  }

  submitWorkflowRow(row: Record<string, unknown>): void {
    this.runWorkflowAction(row, 'soumettre', {});
  }

  validateWorkflowRow(row: Record<string, unknown>): void {
    this.runWorkflowAction(row, 'valider', {});
  }

  openWorkflowDecision(row: Record<string, unknown>, action: WorkflowDecisionAction): void {
    const id = this.resolveRowId(row);
    if (id == null || !this.canRejectOrReturnWorkflow(row)) {
      return;
    }
    this.workflowDecisionOpen = true;
    this.workflowDecisionAction = action;
    this.workflowDecisionTarget = row;
    this.workflowDecisionText = '';
    this.workflowDecisionError = null;
  }

  closeWorkflowDecision(): void {
    this.workflowDecisionOpen = false;
    this.workflowDecisionAction = null;
    this.workflowDecisionTarget = null;
    this.workflowDecisionText = '';
    this.workflowDecisionError = null;
  }

  confirmWorkflowDecision(): void {
    if (!this.workflowDecisionTarget || !this.workflowDecisionAction) {
      return;
    }
    const text = this.workflowDecisionText.trim();
    if (this.workflowDecisionAction === 'rejeter' && !text) {
      this.workflowDecisionError = 'Le motif de rejet est obligatoire.';
      return;
    }
    const payload =
      this.workflowDecisionAction === 'rejeter'
        ? { motif: text }
        : { commentaire: text || null };
    this.runWorkflowAction(this.workflowDecisionTarget, this.workflowDecisionAction, payload);
  }

  private runWorkflowAction(
    row: Record<string, unknown>,
    action: 'soumettre' | 'valider' | WorkflowDecisionAction,
    payload: Record<string, unknown>,
  ): void {
    const id = this.resolveRowId(row);
    if (!this.apiPath || id == null || this.workflowSubmittingId !== null) {
      return;
    }
    this.workflowSubmittingId = id;
    this.errorMessage = null;
    this.workflowDecisionError = null;
    const params: Record<string, string> = {
      resource: this.apiPath,
      recordId: String(id),
    };
    const feature = this.workflowFeature ?? this.permissionFeature;
    if (feature) {
      params['feature'] = feature;
    }
    const url = `${this.apiBaseUrl}/api/saisie-workflows/${action}`;
    this.http.put<unknown>(url, payload, { params }).subscribe({
      next: () => {
        this.workflowSubmittingId = null;
        this.closeWorkflowDecision();
        this.successMessage = this.workflowSuccessMessage(action);
        this.fetch();
      },
      error: (err: HttpErrorResponse) => {
        this.workflowSubmittingId = null;
        const msg = formatHttpError(err, 'Action de workflow refusée.');
        if (this.workflowDecisionOpen) {
          this.workflowDecisionError = msg;
        } else {
          this.errorMessage = msg;
        }
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
    return '—';
  }

  getFieldOptions(field: ReferentielFormField): Array<{ value: string | number; label: string }> {
    const options = field.options?.length
      ? field.options
      : (this.fieldOptions[this.optionsCacheKey(field)] ?? []);
    return sortByLabel(options, (opt) => opt.label);
  }

  clearListFilter(): void {
    this.listFilter = '';
    this.resetListPage();
  }

  clearAllListFilters(): void {
    this.clearListFilter();
    this.clearWorkflowQueueFilters();
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

  isWorkflowEditable(row: Record<string, unknown>): boolean {
    if (!this.hasWorkflow) {
      return true;
    }
    const editable = row['workflowEditable'];
    if (typeof editable === 'boolean') {
      return editable;
    }
    const status = this.workflowStatus(row);
    if (status === null) {
      return !this.bool(row['valideeCoordonnateur']);
    }
    return status === 'BROUILLON' || status === 'RETOURNE';
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

  openDetails(row: Record<string, unknown>): void {
    const id = this.resolveRowId(row);
    if (id == null || !this.apiPath) {
      return;
    }
    this.detailModalOpen = true;
    this.detailLoading = true;
    this.detailFields = [];
    this.detailSubtitle = this.buildDeleteLabel(row);
    const url = `${this.apiBaseUrl}${this.apiPath}/${encodeURIComponent(String(id))}`;
    this.http.get<Record<string, unknown>>(url).subscribe({
      next: (full) => {
        this.detailFields = this.buildDetailFields(full);
        this.detailLoading = false;
      },
      error: () => {
        this.detailFields = this.buildDetailFields(row);
        this.detailLoading = false;
      },
    });
  }

  closeDetails(): void {
    this.detailModalOpen = false;
    this.detailLoading = false;
    this.detailFields = [];
    this.detailSubtitle = '';
  }

  private buildDetailFields(row: Record<string, unknown>): MenaRecordDetailField[] {
    const seen = new Set<string>();
    const fields: MenaRecordDetailField[] = [];
    const push = (key: string, label?: string) => {
      if (seen.has(key) || key.startsWith('_') || key === 'hibernateLazyInitializer') {
        return;
      }
      if (this.shouldSkipDetailKey(key, row)) {
        return;
      }
      seen.add(key);
      fields.push({
        label: label ?? this.columnHeaderLabel(key),
        value: this.formatCell(row[key], key),
      });
    };
    for (const f of this.fieldsForForm) {
      push(f.key, f.label);
    }
    const keys = Object.keys(row).sort((a, b) => a.localeCompare(b, 'fr'));
    for (const k of keys) {
      push(k);
    }
    return fields;
  }

  /** Évite le doublon id brut + objet référentiel enrichi (ex. performance : idPeriodeActivite + periodeActivite). */
  private shouldSkipDetailKey(key: string, row: Record<string, unknown>): boolean {
    const refByIdKey: Record<string, string> = {
      idPeriodeActivite: 'periodeActivite',
      idAlpha: 'alpha',
      idNiveauAlpha: 'niveauAlpha',
      idNiveauControle: 'niveauControle',
      idNiveauEvaluation: 'niveauEvaluation',
      idThemeEvaluation: 'themeEvaluation',
      idTauxEvaluation: 'tauxEvaluation',
    };
    const refKey = refByIdKey[key];
    if (!refKey) {
      return false;
    }
    const ref = row[refKey];
    return ref != null && typeof ref === 'object';
  }

  openEditModal(row: Record<string, unknown>): void {
    if (!this.hasCreateForm || !this.canUpdateRecord || !this.isWorkflowEditable(row)) {
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
      this.http.post<Record<string, unknown>>(url, payload).subscribe({
        next: (created) => {
          const id = this.resolveRowId(created);
          const done = () => this.onFormSuccess('Enregistrement créé avec succès.');
          if (this.hasWorkflow && this.workflowFeature && this.auth.hasRole('CONSEILLER') && id != null) {
            const feat = this.workflowFeature ?? 'SAISIE_DONNEES';
            this.http
              .post(`${this.apiBaseUrl}/api/saisie-workflows/claim`, {}, {
                params: { resource: this.apiPath, recordId: String(id), feature: feat },
              })
              .subscribe({ next: () => done(), error: () => done() });
            return;
          }
          done();
        },
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
    if (!this.canDeleteRecord || !this.isWorkflowEditable(row)) {
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
    return 'Cet enregistrement';
  }

  private hasPermission(permission: string): boolean {
    if (!this.permissionFeature) {
      return true;
    }
    return this.auth.hasPermission(`${this.permissionFeature}:${permission}`);
  }

  private workflowStatus(row: Record<string, unknown>): WorkflowStatus | null {
    const raw = row['workflowStatut'];
    if (typeof raw !== 'string') {
      return null;
    }
    switch (raw) {
      case 'BROUILLON':
      case 'SOUMIS':
      case 'VALIDEE_COORDONNATEUR':
      case 'VALIDEE_SUPERVISEUR':
      case 'VALIDEE_CENTRALE':
      case 'REJETE':
      case 'RETOURNE':
        return raw;
      default: {
        const _exhaustive: never = raw as never;
        void _exhaustive;
        return null;
      }
    }
  }

  private workflowStatusText(status: WorkflowStatus): string {
    switch (status) {
      case 'BROUILLON':
        return 'Brouillon';
      case 'SOUMIS':
        return 'Soumis';
      case 'VALIDEE_COORDONNATEUR':
        return 'Validé coordonnateur';
      case 'VALIDEE_SUPERVISEUR':
        return 'Validé superviseur';
      case 'VALIDEE_CENTRALE':
        return 'Validé central';
      case 'REJETE':
        return 'Rejeté';
      case 'RETOURNE':
        return 'Retourné';
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }

  private workflowSuccessMessage(action: 'soumettre' | 'valider' | WorkflowDecisionAction): string {
    switch (action) {
      case 'soumettre':
        return 'Donnée soumise pour validation.';
      case 'valider':
        return 'Validation effectuée.';
      case 'rejeter':
        return 'Donnée rejetée.';
      case 'retourner':
        return 'Donnée retournée pour correction.';
      default: {
        const _exhaustive: never = action;
        return _exhaustive;
      }
    }
  }

  private nextWorkflowStatus(row: Record<string, unknown>): WorkflowStatus | null {
    const feature = this.workflowFeature ?? this.permissionFeature;
    if (feature && !this.auth.hasPermission(`${feature}:VALIDER`)) {
      return null;
    }
    const status = this.workflowStatus(row);
    if (status === 'SOUMIS' && this.hasValidatorRole(['COORDONNATEUR'])) {
      return 'VALIDEE_COORDONNATEUR';
    }
    if (
      status === 'VALIDEE_COORDONNATEUR' &&
      this.hasValidatorRole(['SUPERVISEUR'])
    ) {
      return 'VALIDEE_SUPERVISEUR';
    }
    if (
      status === 'VALIDEE_SUPERVISEUR' &&
      this.hasValidatorRole(['SUPERVISEUR_AENF', 'DIRECTEUR'])
    ) {
      return 'VALIDEE_CENTRALE';
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
        this.loadWorkflowStatuses();
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
    /** Clé primaire : jamais affichée en liste (évite la colonne « Réf. » / id brut). */
    hiddenIds.add('id');
    for (const k of keys) {
      const nestedFk = k.match(/^id([A-Z][\w]*)$/);
      if (nestedFk) {
        const rest = nestedFk[1];
        const nestedKey = rest.charAt(0).toLowerCase() + rest.slice(1);
        const nested = first[nestedKey];
        if (nested != null && typeof nested === 'object' && !Array.isArray(nested)) {
          hiddenIds.add(k);
        }
      }
      if (!k.startsWith('id') || k.length <= 2) continue;
      const suffix = k.slice(2);
      const labelCandidates = [`nom${suffix}`, `libelle${suffix}`, `label${suffix}`];
      if (labelCandidates.some((c) => c in first)) hiddenIds.add(k);
    }
    const visibleKeys = keys.filter((k) => !hiddenIds.has(k));
    const workflowKeys = new Set([
      'workflowStatut',
      'workflowStatutLibelle',
      'workflowEditable',
      'workflowMotifRejet',
      'workflowCommentaireRetour',
      'workflowSoumisPar',
      'workflowProprietaire',
      'workflowDecidePar',
      'workflowDateSoumission',
      'workflowDateDecision',
      'resourcePath',
      'recordId',
    ]);
    const businessVisibleKeys = filterVisibleListColumns(
      visibleKeys.filter((k) => !workflowKeys.has(k)),
    );
    businessVisibleKeys.sort();
    this.filterableKeys = businessVisibleKeys;

    const preferred = this.inputListColumnKeys ?? this.routeListColumnKeys;
    if (preferred != null && preferred.length > 0) {
      this.columns = filterVisibleListColumns(
        preferred.filter((k) => k in first && !hiddenIds.has(k) && !workflowKeys.has(k)),
      );
      return;
    }
    this.columns = businessVisibleKeys.slice(0, 18);
  }

  private loadWorkflowStatuses(): void {
    if (!this.hasWorkflow || !this.apiPath || !this.rows.length) {
      return;
    }
    const ids = this.rows
      .map((row) => this.resolveRowId(row))
      .filter((id): id is string | number => id != null)
      .map((id) => String(id));
    if (!ids.length) {
      return;
    }
    this.http.get<Record<string, Record<string, unknown>>>(
      `${this.apiBaseUrl}/api/saisie-workflows/statuses`,
      {
        params: {
          resource: this.apiPath,
          ids: ids.join(','),
        },
      },
    ).subscribe({
      next: (statuses) => {
        this.rows = this.rows.map((row) => {
          const id = this.resolveRowId(row);
          const status = id == null ? null : statuses[String(id)];
          return status ? { ...row, ...status } : row;
        });
        this.applyCommissionSaisieListFilter();
        this.buildColumns();
      },
      error: () => {
        /* silencieux : la liste reste disponible, sans statut transversal */
      },
    });
  }

  /**
   * Conseiller : lignes dont il est propriétaire / soumissionnaire (ou brouillon sans propriétaire en base).
   * Coordinateur et rôles de validation : hors brouillon, filtré par IEP lorsque l’utilisateur et la ligne ont un idIep.
   */
  private applyCommissionSaisieListFilter(): void {
    if (!this.hasWorkflow || !this.workflowFeature) {
      return;
    }
    const s = this.auth.currentSession;
    if (!s) {
      return;
    }
    if (this.auth.hasAnyRole(['ADMIN', 'SUPER_ADMIN', 'SUPER_ROOT'])) {
      return;
    }
    this.rows = this.rows.filter((row) => this.rowVisibleForCommissionSession(row));
  }

  private rowVisibleForCommissionSession(row: Record<string, unknown>): boolean {
    const s = this.auth.currentSession;
    if (!s) {
      return true;
    }
    const st = (row['workflowStatut'] as string | undefined) ?? 'BROUILLON';
    const prop = row['workflowProprietaire'] as string | null | undefined;
    const soum = row['workflowSoumisPar'] as string | null | undefined;
    const rowIep = this.resolveRowIepId(row);
    if (this.auth.hasRole('CONSEILLER')) {
      if (prop === s.username || soum === s.username) {
        return true;
      }
      return st === 'BROUILLON' && prop == null && soum == null;
    }
    if (
      this.auth.hasAnyRole([
        'COORDONNATEUR',
        'SUPERVISEUR',
        'SUPERVISEUR_AENF',
        'DIRECTEUR',
        'IEPP',
      ])
    ) {
      if (st === 'BROUILLON') {
        return false;
      }
      if (s.idIep != null && rowIep != null && rowIep !== s.idIep) {
        return false;
      }
      return true;
    }
    return true;
  }

  private resolveRowIepId(row: Record<string, unknown>): number | null {
    const v = row['idIep'];
    if (typeof v === 'number' && Number.isFinite(v)) {
      return v;
    }
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
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
