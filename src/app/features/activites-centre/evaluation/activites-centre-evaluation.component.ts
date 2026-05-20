import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { formatHttpError } from '@core/utils/http-error.util';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '@services/auth.service';
import { MenaWorkflowQueueToolbarComponent } from '@shared/mena-workflow-queue-toolbar/mena-workflow-queue-toolbar.component';
import {
  collectConseillerFilterOptions,
  readWorkflowQueueTab,
  resolveRowConseillerLogin,
  rowMatchesWorkflowTab,
  type WorkflowQueueTab,
} from '@core/workflow/workflow-queue.util';

import {
  menaActivitesRefOptions,
  sortActivitesRefs,
} from '@features/activites-centre/activites-centre-select.util';
import { MenaRowActionButtonComponent } from '@shared/mena-row-action-button/mena-row-action-button.component';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import {
  sortByLabel,
  toMenaSelectOptions,
  toMenaSelectOptionsFromPairs,
} from '@shared/mena-searchable-select/mena-select-options.util';
import { MenaToolbarButtonComponent } from '@shared/mena-toolbar-button/mena-toolbar-button.component';
import { MenaContextDashboardComponent } from '@shared/mena-context-dashboard/mena-context-dashboard.component';

type Ref = {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
  niveau?: string | null;
};

type AlphaOption = {
  idCentre?: number | null;
  id?: number | null;
  codeCentre?: string | null;
  code?: string | null;
  libelle?: string | null;
};

type EvaluationRow = {
  id?: number | null;
  alpha?: Ref | null;
  periodeActivite?: Ref | null;
  niveauEvaluation?: Ref | null;
  themeEvaluation?: Ref | null;
  tauxEvaluation?: Ref | null;
  typeEvaluation?: TypeEvaluation | string | null;
  valideeCoordonnateur?: boolean | null;
  valideeSuperviseur?: boolean | null;
  valideeCentrale?: boolean | null;
  themesTaux?: ThemeTauxRow[] | null;
  workflowStatut?: string | null;
  workflowStatutLibelle?: string | null;
  workflowEditable?: boolean | null;
};

const WORKFLOW_RESOURCE = '/api/evaluation';
const WORKFLOW_FEATURE = 'ACTIVITES_CENTRE_EVALUATION';

type TypeEvaluation = 'FORMATIVE' | 'SOMMATIVE' | 'CERTIFICATIVE';

type ThemeTauxRow = {
  id?: number | null;
  themeEvaluation?: Ref | null;
  taux?: number | null;
};

type ThemeTauxForm = {
  idThemeEvaluation: number;
  taux: number | null;
};

type EvaluationForm = {
  idAlpha: number | null;
  idPeriodeActivite: number | null;
  idNiveauEvaluation: number | null;
  typeEvaluation: TypeEvaluation | null;
  themesTaux: ThemeTauxForm[];
};

@Component({
  selector: 'app-activites-centre-evaluation',
  standalone: true,
  imports: [
    MenaLoadingComponent,
    CommonModule,
    FormsModule,
    MenaRowActionButtonComponent,
    MenaSearchableSelectComponent,
    MenaWorkflowQueueToolbarComponent,
    MenaToolbarButtonComponent,
    MenaContextDashboardComponent,
  ],
  templateUrl: './activites-centre-evaluation.component.html',
  styleUrl: './activites-centre-evaluation.component.css',
})
export class ActivitesCentreEvaluationComponent implements OnInit {
  readonly typeOptions: TypeEvaluation[] = ['FORMATIVE', 'SOMMATIVE', 'CERTIFICATIVE'];

  rows: EvaluationRow[] = [];
  alphas: AlphaOption[] = [];
  periodes: Ref[] = [];
  niveaux: Ref[] = [];
  themes: Ref[] = [];

  loading = false;
  saving = false;
  validatingId: number | null = null;
  workflowSubmittingId: number | null = null;
  formOpen = false;
  detailRow: EvaluationRow | null = null;
  formMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;
  searchText = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  form: EvaluationForm = this.emptyForm();

  constructor(
    private readonly http: HttpClient,
    readonly auth: AuthService,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  get workflowConseillerFilterOptions() {
    return collectConseillerFilterOptions(this.rows as Record<string, unknown>[]);
  }

  get workflowCentreFilterOptions(): Array<{ value: number | ''; label: string }> {
    return [
      { value: '', label: 'Tous les centres' },
      ...this.alphas
        .map((a) => ({
          value: this.alphaOptionId(a) ?? ('' as const),
          label: this.alphaOptionLabel(a),
        }))
        .filter((o) => o.value !== ''),
    ];
  }

  ngOnInit(): void {
    this.reload();
  }

  get canCreate(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_EVALUATION:CREER');
  }

  get canEdit(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_EVALUATION:MODIFIER');
  }

  get canValidate(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_EVALUATION:VALIDER');
  }

  get filteredRows(): EvaluationRow[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.rows;
    return this.rows.filter((row) =>
      [
        row.id,
        this.refLabel(row.alpha),
        this.refLabel(row.periodeActivite),
        this.refLabel(row.niveauEvaluation),
        this.typeLabel(row.typeEvaluation),
        this.themesTauxLabel(row),
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }

  get filteredThemes(): Ref[] {
    const selected = this.niveaux.find((niveau) => niveau.id === this.form.idNiveauEvaluation);
    const niveauCode = this.normalizeNiveau(selected);
    if (!niveauCode) return this.themes;
    return this.themes.filter((theme) => this.themeMatchesNiveau(theme, niveauCode, this.form.typeEvaluation));
  }

  get availableTypeOptions(): TypeEvaluation[] {
    const selected = this.niveaux.find((niveau) => niveau.id === this.form.idNiveauEvaluation);
    const niveauCode = this.normalizeNiveau(selected);
    return this.typeOptions.filter((type) => this.typeAllowedForNiveau(type, niveauCode));
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      evaluations: this.http.get<unknown>(`${this.apiBaseUrl}/api/evaluation`),
      alphas: this.http.get<unknown>(`${this.apiBaseUrl}/api/alpha`, {
        params: { page: '0', size: '2000' },
      }),
      periodes: this.http.get<unknown>(`${this.apiBaseUrl}/api/PeriodeActivites`),
      niveaux: this.http.get<unknown>(`${this.apiBaseUrl}/api/niveaux-evaluation`),
      themes: this.http.get<unknown>(`${this.apiBaseUrl}/api/themes-evaluation`),
    }).subscribe({
      next: ({ evaluations, alphas, periodes, niveaux, themes }) => {
        this.rows = unwrapListBody(evaluations) as EvaluationRow[];
        this.alphas = sortByLabel(unwrapListBody(alphas) as AlphaOption[], (a) => this.alphaOptionLabel(a));
        this.periodes = sortActivitesRefs(unwrapListBody(periodes) as Ref[]);
        this.niveaux = sortActivitesRefs(unwrapListBody(niveaux) as Ref[]);
        this.themes = sortActivitesRefs(unwrapListBody(themes) as Ref[]);
        this.loading = false;
        this.loadWorkflowStatuses();
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  openCreate(): void {
    this.formMode = 'create';
    this.editingId = null;
    this.form = this.emptyForm();
    this.formOpen = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  openEdit(row: EvaluationRow): void {
    if (!this.canEdit || this.isLocked(row)) return;
    this.formMode = 'edit';
    this.editingId = row.id ?? null;
    this.form = {
      idAlpha: row.alpha?.id ?? null,
      idPeriodeActivite: row.periodeActivite?.id ?? null,
      idNiveauEvaluation: row.niveauEvaluation?.id ?? null,
      typeEvaluation: this.asTypeEvaluation(row.typeEvaluation),
      themesTaux:
        row.themesTaux?.map((item) => ({
          idThemeEvaluation: item.themeEvaluation?.id ?? 0,
          taux: item.taux ?? null,
        })).filter((item) => item.idThemeEvaluation > 0) ?? [],
    };
    this.syncThemeTauxRows();
    this.formOpen = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  openDetail(row: EvaluationRow): void {
    this.detailRow = row;
  }

  closeDetail(): void {
    this.detailRow = null;
  }

  onNiveauChange(): void {
    if (!this.availableTypeOptions.some((type) => type === this.form.typeEvaluation)) {
      this.form.typeEvaluation = null;
    }
    this.syncThemeTauxRows();
  }

  onTypeChange(): void {
    this.syncThemeTauxRows();
  }

  save(): void {
    if (!this.form.idAlpha) {
      this.errorMessage = 'Le centre Alpha est obligatoire.';
      return;
    }
    if (!this.form.idNiveauEvaluation) {
      this.errorMessage = 'Le niveau d’évaluation est obligatoire.';
      return;
    }
    if (!this.form.typeEvaluation) {
      this.errorMessage = 'Le type d’évaluation est obligatoire.';
      return;
    }
    if (this.form.themesTaux.length === 0) {
      this.errorMessage = 'Aucun thème compatible avec ce niveau et ce type.';
      return;
    }
    const invalidTheme = this.form.themesTaux.find((item) => item.taux == null || item.taux < 0 || item.taux > 100);
    if (invalidTheme) {
      this.errorMessage = 'Chaque thème doit avoir un taux compris entre 0 et 100.';
      return;
    }

    this.saving = true;
    const payload = {
      ...this.form,
      themesTaux: this.form.themesTaux.map((item) => ({
        idThemeEvaluation: item.idThemeEvaluation,
        taux: item.taux,
      })),
    };
    const request =
      this.formMode === 'edit' && this.editingId != null
        ? this.http.put<EvaluationRow>(`${this.apiBaseUrl}/api/evaluation/${this.editingId}`, payload)
        : this.http.post<EvaluationRow>(`${this.apiBaseUrl}/api/evaluation`, payload);

    request.subscribe({
      next: (body) => {
        this.saving = false;
        this.formOpen = false;
        this.successMessage = this.formMode === 'edit' ? 'Évaluation modifiée.' : 'Évaluation enregistrée.';
        if (this.formMode === 'create' && body?.id != null) {
          const newId = Number(body.id);
          if (!Number.isNaN(newId)) {
            this.claimWorkflowThenReload(newId);
            return;
          }
        }
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  deleteRow(row: EvaluationRow): void {
    if (!this.canEdit || row.id == null || this.isLocked(row)) return;
    if (!window.confirm(`Supprimer l’évaluation ${row.id} ?`)) return;
    this.http.delete(`${this.apiBaseUrl}/api/evaluation/${row.id}`).subscribe({
      next: () => {
        this.successMessage = 'Évaluation supprimée.';
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = this.httpError(err);
      },
    });
  }

  validateRow(row: EvaluationRow): void {
    const step = this.nextValidationStep(row);
    if (row.id == null || step == null || this.validatingId != null) return;
    if (step === 'valider-coordonnateur' && this.readWorkflowStatut(row) !== 'SOUMIS') {
      this.errorMessage =
        'Le conseiller doit d’abord soumettre la ligne pour validation (bouton Soumettre).';
      return;
    }
    this.validatingId = row.id;
    this.errorMessage = null;
    this.http.put(`${this.apiBaseUrl}/api/evaluation/${row.id}/${step}`, {}).subscribe({
      next: () => {
        this.validatingId = null;
        this.successMessage = 'Validation effectuée.';
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.validatingId = null;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  alphaOptionId(alpha: AlphaOption): number | null {
    return alpha.idCentre ?? alpha.id ?? null;
  }

  alphaOptionLabel(alpha: AlphaOption): string {
    return alpha.libelle?.trim() || `Centre #${this.alphaOptionId(alpha) ?? '—'}`;
  }

  refLabel(ref: Ref | null | undefined): string {
    if (!ref) return '-';
    return ref.libelle?.trim() || ref.code?.trim() || `#${ref.id ?? ''}`;
  }

  menaAlphaFormOptions() {
    return toMenaSelectOptions(this.alphas, (a) => this.alphaOptionId(a), (a) => this.alphaOptionLabel(a));
  }

  menaPeriodeFormOptions() {
    return menaActivitesRefOptions(this.periodes, (p) => p.id ?? null);
  }

  menaNiveauFormOptions() {
    return menaActivitesRefOptions(this.niveaux, (n) => n.id ?? null);
  }

  menaTypeFormOptions() {
    return toMenaSelectOptionsFromPairs(
      this.availableTypeOptions.map((type) => ({ value: type, label: this.typeLabel(type) })),
    );
  }

  typeLabel(type: TypeEvaluation | string | null | undefined): string {
    if (type === 'FORMATIVE') return 'Formative';
    if (type === 'SOMMATIVE') return 'Sommative';
    if (type === 'CERTIFICATIVE') return 'Certificative';
    return '-';
  }

  validationLabel(row: EvaluationRow): string {
    if (row.valideeCentrale) return 'Validé central';
    if (row.valideeSuperviseur) return 'Validé superviseur';
    if (row.valideeCoordonnateur) return 'Validé coordonnateur';
    const st = this.readWorkflowStatut(row);
    if (st === 'SOUMIS') return 'En attente coordonnateur';
    if (st === 'RETOURNE') return 'Retourné pour correction';
    if (st === 'REJETE') return 'Rejeté';
    if (st === 'BROUILLON') return 'Brouillon (à soumettre)';
    return 'En attente coordonnateur';
  }

  validationClass(row: EvaluationRow): string {
    if (row.valideeCentrale) return 'badge-success';
    if (row.valideeSuperviseur) return 'badge-primary';
    if (row.valideeCoordonnateur) return 'badge-info';
    const st = this.readWorkflowStatut(row);
    if (st === 'REJETE') return 'badge-danger';
    if (st === 'RETOURNE' || st === 'BROUILLON') return 'badge-warning';
    if (st === 'SOUMIS') return 'badge-secondary';
    return 'badge-secondary';
  }

  isLocked(row: EvaluationRow): boolean {
    if (Boolean(row.valideeCoordonnateur || row.valideeSuperviseur || row.valideeCentrale)) {
      return true;
    }
    return this.isTransversalWorkflowLocked(row);
  }

  canSubmitWorkflow(row: EvaluationRow): boolean {
    if (row.id == null || this.workflowSubmittingId != null) return false;
    if (!this.auth.hasPermission(`${WORKFLOW_FEATURE}:MODIFIER`)) return false;
    const st = this.readWorkflowStatut(row);
    return st === 'BROUILLON' || st === 'RETOURNE';
  }

  submitWorkflow(row: EvaluationRow): void {
    const id = row.id;
    if (id == null || this.workflowSubmittingId != null) return;
    this.workflowSubmittingId = id;
    this.errorMessage = null;
    this.http
      .put<unknown>(`${this.apiBaseUrl}/api/saisie-workflows/soumettre`, {}, {
        params: {
          resource: WORKFLOW_RESOURCE,
          recordId: String(id),
          feature: WORKFLOW_FEATURE,
        },
      })
      .subscribe({
        next: () => {
          this.workflowSubmittingId = null;
          this.successMessage = 'Donnée soumise pour validation.';
          this.reload();
        },
        error: (err: unknown) => {
          this.workflowSubmittingId = null;
          this.errorMessage = formatHttpError(err, 'Soumission refusée.');
        },
      });
  }

  canValidateRow(row: EvaluationRow): boolean {
    return this.nextValidationStep(row) !== null;
  }

  themesTauxLabel(row: EvaluationRow): string {
    const rows = row.themesTaux ?? [];
    if (rows.length > 0) {
      const filled = rows.filter((item) => item.taux != null);
      if (filled.length === 0) return `${rows.length} thème(s)`;
      return `${filled.length}/${rows.length} thème(s) renseigné(s)`;
    }
    if (row.themeEvaluation) {
      return `${this.refLabel(row.themeEvaluation)}${row.tauxEvaluation ? ` : ${this.refLabel(row.tauxEvaluation)}` : ''}`;
    }
    return '-';
  }

  themeForForm(item: ThemeTauxForm): Ref | null {
    return this.themes.find((theme) => theme.id === item.idThemeEvaluation) ?? null;
  }

  themeNiveauHint(theme: Ref | null): string {
    const niveau = this.normalizeText(theme?.niveau);
    if (niveau === 'NIVEAU_1') return 'Niveau 1';
    if (niveau === 'NIVEAU_2') return 'Niveau 2';
    if (niveau === 'POST_ALPHA') return 'Post Alpha';
    return '';
  }

  themeOptionLabel(theme: Ref | null): string {
    return this.refLabel(theme);
  }

  private emptyForm(): EvaluationForm {
    return {
      idAlpha: null,
      idPeriodeActivite: null,
      idNiveauEvaluation: null,
      typeEvaluation: null,
      themesTaux: [],
    };
  }

  private normalizeNiveau(niveau: Ref | undefined): 'NIVEAU_1' | 'NIVEAU_2' | 'POST_ALPHA' | null {
    const value = this.normalizeText(`${niveau?.code ?? ''} ${niveau?.libelle ?? ''}`);
    if (value.includes('POST')) return 'POST_ALPHA';
    if (value.includes('2')) return 'NIVEAU_2';
    if (value.includes('1')) return 'NIVEAU_1';
    return null;
  }

  private themeMatchesNiveau(theme: Ref, niveau: 'NIVEAU_1' | 'NIVEAU_2' | 'POST_ALPHA', type: TypeEvaluation | null): boolean {
    const themeNiveau = this.normalizeText(theme.niveau);
    if (themeNiveau && themeNiveau !== niveau) {
      return false;
    }
    const label = this.normalizeText(`${theme.code ?? ''} ${theme.libelle ?? ''}`);
    if (label.includes('FORMATIVE')) return type === 'FORMATIVE' && niveau === 'NIVEAU_1';
    if (label.includes('CERTIFICATIVE')) return type === 'CERTIFICATIVE' && (niveau === 'NIVEAU_2' || niveau === 'POST_ALPHA');
    if (label.includes('SOMMATIVE')) return !type || type === 'SOMMATIVE';
    return true;
  }

  private typeAllowedForNiveau(type: TypeEvaluation, niveau: 'NIVEAU_1' | 'NIVEAU_2' | 'POST_ALPHA' | null): boolean {
    if (!niveau) return true;
    if (type === 'FORMATIVE') return niveau === 'NIVEAU_1';
    if (type === 'CERTIFICATIVE') return niveau === 'NIVEAU_2' || niveau === 'POST_ALPHA';
    return true;
  }

  private syncThemeTauxRows(): void {
    const previous = new Map(this.form.themesTaux.map((item) => [item.idThemeEvaluation, item.taux]));
    this.form.themesTaux = this.filteredThemes
      .map((theme) => theme.id)
      .filter((id): id is number => id != null)
      .map((id) => ({
        idThemeEvaluation: id,
        taux: previous.get(id) ?? null,
      }));
  }

  private asTypeEvaluation(type: TypeEvaluation | string | null | undefined): TypeEvaluation | null {
    const value = this.normalizeText(type);
    if (value === 'FORMATIVE' || value === 'SOMMATIVE' || value === 'CERTIFICATIVE') return value;
    return null;
  }

  private nextValidationStep(row: EvaluationRow): string | null {
    if (!this.canValidate) return null;
    if (!row.valideeCoordonnateur && this.hasValidatorRole(['COORDONNATEUR'])) {
      if (this.readWorkflowStatut(row) !== 'SOUMIS') return null;
      return 'valider-coordonnateur';
    }
    if (row.valideeCoordonnateur && !row.valideeSuperviseur && this.hasValidatorRole(['SUPERVISEUR'])) {
      return 'valider-superviseur';
    }
    if (row.valideeSuperviseur && !row.valideeCentrale && this.hasValidatorRole(['SUPERVISEUR_AENF', 'DIRECTEUR'])) {
      return 'valider-centrale';
    }
    return null;
  }

  private loadWorkflowStatuses(): void {
    const ids = this.rows
      .map((r) => r.id)
      .filter((id): id is number => id != null && Number.isFinite(Number(id)))
      .map((id) => String(id));
    if (!ids.length) return;
    this.http
      .get<Record<string, Record<string, unknown>>>(`${this.apiBaseUrl}/api/saisie-workflows/statuses`, {
        params: {
          resource: WORKFLOW_RESOURCE,
          ids: ids.join(','),
        },
      })
      .subscribe({
        next: (statuses) => {
          this.rows = this.rows.map((row) => {
            const id = row.id;
            const st = id == null ? null : statuses[String(id)];
            return st ? { ...row, ...st } : row;
          });
        },
        error: () => {
          /* liste utilisable sans enrichissement workflow */
        },
      });
  }

  private claimWorkflowThenReload(recordId: number): void {
    this.http
      .post<unknown>(
        `${this.apiBaseUrl}/api/saisie-workflows/claim`,
        {},
        {
          params: {
            resource: WORKFLOW_RESOURCE,
            recordId: String(recordId),
            feature: WORKFLOW_FEATURE,
          },
        },
      )
      .subscribe({
        next: () => this.reload(),
        error: () => this.reload(),
      });
  }

  private readWorkflowStatut(row: EvaluationRow): string | null {
    const raw = row.workflowStatut;
    if (typeof raw !== 'string' || !raw.trim()) return null;
    return raw.trim();
  }

  private isTransversalWorkflowLocked(row: EvaluationRow): boolean {
    const st = this.readWorkflowStatut(row);
    if (st == null) return false;
    return st !== 'BROUILLON' && st !== 'RETOURNE';
  }

  private hasValidatorRole(roles: string[]): boolean {
    return this.auth.hasAnyRole([...roles, 'ADMIN', 'SUPER_ADMIN', 'SUPER_ROOT']);
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
  }

  private httpError(err: HttpErrorResponse): string {
    const body = err.error as { message?: string } | string | null;
    if (typeof body === 'object' && body?.message) return body.message;
    if (typeof body === 'string' && body.trim()) return body;
    return err.message || 'Une erreur est survenue.';
  }
}
