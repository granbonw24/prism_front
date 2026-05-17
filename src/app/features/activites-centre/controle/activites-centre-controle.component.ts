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
  menaActivitesRefOptionsWithAll,
  sortActivitesRefs,
} from '@features/activites-centre/activites-centre-select.util';
import { MenaRowActionButtonComponent } from '@shared/mena-row-action-button/mena-row-action-button.component';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import { MenaContextDashboardComponent } from '@shared/mena-context-dashboard/mena-context-dashboard.component';
import { sortByLabel, toMenaSelectOptions } from '@shared/mena-searchable-select/mena-select-options.util';

type Ref = {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
  codeNiveauAlpha?: string | null;
  libelleNiveauAlpha?: string | null;
  alpha?: Ref | null;
};

type AlphaOption = {
  idCentre?: number | null;
  id?: number | null;
  codeCentre?: string | null;
  code?: string | null;
  libelle?: string | null;
};

type HoraireRow = {
  id?: number | null;
  jourSemaine?: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;
};

type KitRow = {
  id?: number | null;
  manuel?: Ref | null;
  nombreKit?: number | null;
  precisionAutre?: string | null;
};

type ControleRow = {
  id?: number | null;
  alpha?: Ref | null;
  periodeActivite?: Ref | null;
  niveauAlpha?: Ref | null;
  dateDemarrageAppren?: string | null;
  conformiteProgramme?: boolean | null;
  valideeCoordonnateur?: boolean | null;
  valideeSuperviseur?: boolean | null;
  valideeCentrale?: boolean | null;
  horairesFormation?: HoraireRow[] | null;
  kitsManuels?: KitRow[] | null;
  workflowStatut?: string | null;
  workflowStatutLibelle?: string | null;
  workflowEditable?: boolean | null;
};

const WORKFLOW_RESOURCE = '/api/controle';
const WORKFLOW_FEATURE = 'ACTIVITES_CENTRE_CONTROLE';

type HoraireForm = {
  jourSemaine: string;
  label: string;
  selected: boolean;
  heureDebut: string;
  heureFin: string;
};

type KitForm = {
  idManuel: number | null;
  nombreKit: number | null;
  precisionAutre: string;
};

type ControleForm = {
  idAlpha: number | null;
  idPeriodeActivite: number | null;
  dateDemarrageAppren: string;
  idNiveauAlpha: number | null;
  conformiteProgramme: boolean | null;
  horairesFormation: HoraireForm[];
  kitsManuels: KitForm[];
};

const DAYS: Array<{ value: string; label: string }> = [
  { value: 'LUNDI', label: 'Lundi' },
  { value: 'MARDI', label: 'Mardi' },
  { value: 'MERCREDI', label: 'Mercredi' },
  { value: 'JEUDI', label: 'Jeudi' },
  { value: 'VENDREDI', label: 'Vendredi' },
];

@Component({
  selector: 'app-activites-centre-controle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MenaRowActionButtonComponent,
    MenaSearchableSelectComponent,
    MenaWorkflowQueueToolbarComponent,
    MenaContextDashboardComponent,
  ],
  templateUrl: './activites-centre-controle.component.html',
  styleUrl: './activites-centre-controle.component.css',
})
export class ActivitesCentreControleComponent implements OnInit {
  rows: ControleRow[] = [];
  alphas: AlphaOption[] = [];
  periodes: Ref[] = [];
  niveaux: Ref[] = [];
  manuels: Ref[] = [];

  loading = false;
  saving = false;
  validatingId: number | null = null;
  workflowSubmittingId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  searchText = '';
  filterAlphaId: number | '' = '';
  filterPeriodeId: number | '' = '';
  workflowQueueTab: WorkflowQueueTab = 'ACTION';
  workflowFilterConseiller = '';

  formOpen = false;
  formMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;
  form: ControleForm = this.emptyForm();

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
          value: this.alphaOptionValue(a) ?? ('' as const),
          label: this.alphaOptionLabel(a),
        }))
        .filter((o) => o.value !== ''),
    ];
  }

  ngOnInit(): void {
    this.reload();
  }

  get canCreate(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_CONTROLE:CREER');
  }

  get canEdit(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_CONTROLE:MODIFIER');
  }

  get canValidate(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_CONTROLE:VALIDER');
  }

  get filteredRows(): ControleRow[] {
    const q = this.searchText.trim().toLowerCase();
    return this.rows.filter((row) => {
      const alphaId = row.alpha?.id ?? null;
      if (this.filterAlphaId !== '' && alphaId !== this.filterAlphaId) {
        return false;
      }
      const periodeId = row.periodeActivite?.id ?? null;
      if (this.filterPeriodeId !== '' && periodeId !== this.filterPeriodeId) {
        return false;
      }
      const tab = readWorkflowQueueTab(row as Record<string, unknown>);
      if (tab && !rowMatchesWorkflowTab(row as Record<string, unknown>, this.workflowQueueTab)) {
        return false;
      }
      if (this.workflowFilterConseiller) {
        const login = resolveRowConseillerLogin(row as Record<string, unknown>);
        if (login !== this.workflowFilterConseiller) {
          return false;
        }
      }
      if (!q) {
        return true;
      }
      return [
        row.id,
        this.alphaLabel(row),
        row.niveauAlpha?.code ?? row.niveauAlpha?.codeNiveauAlpha,
        row.niveauAlpha?.libelle ?? row.niveauAlpha?.libelleNiveauAlpha,
        row.dateDemarrageAppren,
        this.refLabel(row.periodeActivite),
        this.conformiteLabel(row.conformiteProgramme),
        this.horairesLabel(row),
        this.kitsLabel(row),
      ]
        .filter((v) => v != null)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      controles: this.http.get<unknown>(`${this.apiBaseUrl}/api/controle`),
      alphas: this.http.get<unknown>(`${this.apiBaseUrl}/api/alpha`, {
        params: { page: '0', size: '2000' },
      }),
      periodes: this.http.get<unknown>(`${this.apiBaseUrl}/api/PeriodeActivites`),
      niveaux: this.http.get<unknown>(`${this.apiBaseUrl}/api/niveaualpha`),
      manuels: this.http.get<unknown>(`${this.apiBaseUrl}/api/manuels`),
    }).subscribe({
      next: ({ controles, alphas, periodes, niveaux, manuels }) => {
        this.rows = unwrapListBody(controles) as ControleRow[];
        this.alphas = sortByLabel(unwrapListBody(alphas) as AlphaOption[], (a) => this.alphaOptionLabel(a));
        this.periodes = sortActivitesRefs(unwrapListBody(periodes) as Ref[]);
        this.niveaux = sortActivitesRefs(unwrapListBody(niveaux) as Ref[]);
        this.manuels = sortActivitesRefs(unwrapListBody(manuels) as Ref[]);
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
    if (this.filterAlphaId !== '') {
      this.form.idAlpha = this.filterAlphaId;
    }
    this.formOpen = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  openEdit(row: ControleRow): void {
    if (!this.canEdit || this.isLocked(row)) return;
    this.formMode = 'edit';
    this.editingId = row.id ?? null;
    this.form = this.formFromRow(row);
    this.formOpen = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  closeForm(): void {
    this.formOpen = false;
    this.saving = false;
  }

  addKit(): void {
    this.form.kitsManuels.push({ idManuel: null, nombreKit: null, precisionAutre: '' });
  }

  removeKit(index: number): void {
    this.form.kitsManuels.splice(index, 1);
  }

  save(): void {
    const payload = this.toPayload();
    if (!payload.idAlpha) {
      this.errorMessage = 'Le centre Alpha est obligatoire.';
      return;
    }
    if (!payload.dateDemarrageAppren) {
      this.errorMessage = 'La date de démarrage est obligatoire.';
      return;
    }
    if (!payload.idNiveauAlpha) {
      this.errorMessage = 'Le niveau est obligatoire.';
      return;
    }
    if (!payload.idPeriodeActivite) {
      this.errorMessage = 'La période d’activité est obligatoire.';
      return;
    }
    if (!payload.horairesFormation.length) {
      this.errorMessage = 'Au moins un jour de formation doit être défini.';
      return;
    }
    if (!payload.kitsManuels.length) {
      this.errorMessage = 'Au moins un manuel doit être renseigné dans les kits.';
      return;
    }

    this.saving = true;
    this.errorMessage = null;
    const request =
      this.formMode === 'edit' && this.editingId != null
        ? this.http.put<ControleRow>(`${this.apiBaseUrl}/api/controle/${this.editingId}`, payload)
        : this.http.post<ControleRow>(`${this.apiBaseUrl}/api/controle`, payload);

    request.subscribe({
      next: (body) => {
        this.saving = false;
        this.formOpen = false;
        this.successMessage = this.formMode === 'edit' ? 'Contrôle modifié.' : 'Contrôle enregistré.';
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

  deleteRow(row: ControleRow): void {
    if (!this.canEdit || row.id == null || this.isLocked(row)) return;
    const ok = window.confirm(`Supprimer le contrôle ${row.id} ?`);
    if (!ok) return;
    this.http.delete(`${this.apiBaseUrl}/api/controle/${row.id}`).subscribe({
      next: () => {
        this.successMessage = 'Contrôle supprimé.';
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.errorMessage = this.httpError(err);
      },
    });
  }

  validateRow(row: ControleRow): void {
    const step = this.nextValidationStep(row);
    if (row.id == null || step == null || this.validatingId != null) return;
    if (step === 'valider-coordonnateur' && this.readWorkflowStatut(row) !== 'SOUMIS') {
      this.errorMessage =
        'Le conseiller doit d’abord soumettre la ligne pour validation (bouton Soumettre).';
      return;
    }
    this.validatingId = row.id;
    this.errorMessage = null;
    this.http.put(`${this.apiBaseUrl}/api/controle/${row.id}/${step}`, {}).subscribe({
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

  onWorkflowQueueTabChange(tab: WorkflowQueueTab): void {
    this.workflowQueueTab = tab;
  }

  onWorkflowCentreFilterChange(centreId: number | ''): void {
    this.filterAlphaId = centreId;
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterAlphaId = '';
    this.filterPeriodeId = '';
    this.workflowFilterConseiller = '';
  }

  alphaOptionValue(alpha: AlphaOption): number | '' {
    return alpha.idCentre ?? alpha.id ?? '';
  }

  alphaOptionId(alpha: AlphaOption): number | null {
    return alpha.idCentre ?? alpha.id ?? null;
  }

  alphaOptionLabel(alpha: AlphaOption): string {
    return [alpha.codeCentre ?? alpha.code, alpha.libelle].filter(Boolean).join(' — ') || `Centre ${this.alphaOptionValue(alpha)}`;
  }

  refLabel(ref: Ref | null | undefined): string {
    if (!ref) return '-';
    const code = ref.code ?? ref.codeNiveauAlpha;
    const libelle = ref.libelle ?? ref.libelleNiveauAlpha;
    return [code, libelle].filter(Boolean).join(' — ') || `#${ref.id ?? ''}`;
  }

  niveauxForSelectedAlpha(): Ref[] {
    return this.niveaux;
  }

  menaAlphaFilterOptions() {
    return menaActivitesRefOptionsWithAll(
      this.alphas,
      (a) => this.alphaOptionValue(a as AlphaOption),
      'Tous',
      '',
    );
  }

  menaPeriodeFilterOptions() {
    return menaActivitesRefOptionsWithAll(this.periodes, (p) => p.id ?? '', 'Toutes', '');
  }

  menaAlphaFormOptions() {
    return toMenaSelectOptions(this.alphas, (a) => this.alphaOptionId(a), (a) => this.alphaOptionLabel(a));
  }

  menaPeriodeFormOptions() {
    return menaActivitesRefOptions(this.periodes, (p) => p.id ?? null);
  }

  menaNiveauFormOptions() {
    return menaActivitesRefOptions(this.niveauxForSelectedAlpha(), (n) => n.id ?? null);
  }

  menaManuelOptions() {
    return menaActivitesRefOptions(this.manuels, (m) => m.id ?? null);
  }

  alphaLabel(row: ControleRow): string {
    return this.refLabel(row.alpha);
  }

  conformiteLabel(value: boolean | null | undefined): string {
    if (value === true) return 'Oui';
    if (value === false) return 'Non';
    return '-';
  }

  validationLabel(row: ControleRow): string {
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

  validationClass(row: ControleRow): string {
    if (row.valideeCentrale) return 'badge-success';
    if (row.valideeSuperviseur) return 'badge-primary';
    if (row.valideeCoordonnateur) return 'badge-info';
    const st = this.readWorkflowStatut(row);
    if (st === 'REJETE') return 'badge-danger';
    if (st === 'RETOURNE' || st === 'BROUILLON') return 'badge-warning';
    if (st === 'SOUMIS') return 'badge-secondary';
    return 'badge-secondary';
  }

  isLocked(row: ControleRow): boolean {
    if (Boolean(row.valideeCoordonnateur || row.valideeSuperviseur || row.valideeCentrale)) {
      return true;
    }
    return this.isTransversalWorkflowLocked(row);
  }

  canSubmitWorkflow(row: ControleRow): boolean {
    if (row.id == null || this.workflowSubmittingId != null) return false;
    if (!this.auth.hasPermission(`${WORKFLOW_FEATURE}:MODIFIER`)) return false;
    const st = this.readWorkflowStatut(row);
    return st === 'BROUILLON' || st === 'RETOURNE';
  }

  submitWorkflow(row: ControleRow): void {
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

  canValidateRow(row: ControleRow): boolean {
    return this.nextValidationStep(row) !== null;
  }

  horairesLabel(row: ControleRow): string {
    const horaires = row.horairesFormation ?? [];
    if (!horaires.length) return '-';
    return horaires
      .map((h) => `${this.dayLabel(h.jourSemaine)} ${h.heureDebut ?? ''}-${h.heureFin ?? ''}`)
      .join(', ');
  }

  kitsLabel(row: ControleRow): string {
    const kits = row.kitsManuels ?? [];
    if (!kits.length) return '-';
    return kits.map((k) => `${this.refLabel(k.manuel)}: ${k.nombreKit ?? 0}`).join(', ');
  }

  trackByIndex(index: number): number {
    return index;
  }

  private emptyForm(): ControleForm {
    return {
      idAlpha: null,
      idPeriodeActivite: null,
      dateDemarrageAppren: '',
      idNiveauAlpha: null,
      conformiteProgramme: null,
      horairesFormation: DAYS.map((d) => ({
        jourSemaine: d.value,
        label: d.label,
        selected: false,
        heureDebut: '',
        heureFin: '',
      })),
      kitsManuels: [{ idManuel: null, nombreKit: null, precisionAutre: '' }],
    };
  }

  private formFromRow(row: ControleRow): ControleForm {
    const form = this.emptyForm();
    form.idAlpha = row.alpha?.id ?? null;
    form.idPeriodeActivite = row.periodeActivite?.id ?? null;
    form.dateDemarrageAppren = row.dateDemarrageAppren ?? '';
    form.idNiveauAlpha = row.niveauAlpha?.id ?? null;
    form.conformiteProgramme = row.conformiteProgramme ?? null;
    const horaires = row.horairesFormation ?? [];
    for (const h of horaires) {
      const target = form.horairesFormation.find((x) => x.jourSemaine === h.jourSemaine);
      if (target) {
        target.selected = true;
        target.heureDebut = h.heureDebut ?? '';
        target.heureFin = h.heureFin ?? '';
      }
    }
    form.kitsManuels = (row.kitsManuels ?? []).map((k) => ({
      idManuel: k.manuel?.id ?? null,
      nombreKit: k.nombreKit ?? null,
      precisionAutre: k.precisionAutre ?? '',
    }));
    if (!form.kitsManuels.length) {
      form.kitsManuels = [{ idManuel: null, nombreKit: null, precisionAutre: '' }];
    }
    return form;
  }

  private toPayload(): {
    idAlpha: number | null;
    idPeriodeActivite: number | null;
    dateDemarrageAppren: string;
    idNiveauAlpha: number | null;
    conformiteProgramme: boolean | null;
    horairesFormation: Array<{ jourSemaine: string; heureDebut: string; heureFin: string }>;
    kitsManuels: Array<{ idManuel: number; nombreKit: number; precisionAutre: string | null }>;
  } {
    return {
      idAlpha: this.form.idAlpha,
      idPeriodeActivite: this.form.idPeriodeActivite,
      dateDemarrageAppren: this.form.dateDemarrageAppren,
      idNiveauAlpha: this.form.idNiveauAlpha,
      conformiteProgramme: this.form.conformiteProgramme,
      horairesFormation: this.form.horairesFormation
        .filter((h) => h.selected)
        .map((h) => ({ jourSemaine: h.jourSemaine, heureDebut: h.heureDebut, heureFin: h.heureFin })),
      kitsManuels: this.form.kitsManuels
        .filter((k): k is KitForm & { idManuel: number } => k.idManuel != null)
        .map((k) => ({
          idManuel: k.idManuel,
          nombreKit: Number(k.nombreKit ?? 0),
          precisionAutre: k.precisionAutre?.trim() || null,
        })),
    };
  }

  private dayLabel(day: string | null | undefined): string {
    return DAYS.find((d) => d.value === day)?.label ?? day ?? '-';
  }

  private nextValidationStep(row: ControleRow): string | null {
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

  private readWorkflowStatut(row: ControleRow): string | null {
    const raw = row.workflowStatut;
    if (typeof raw !== 'string' || !raw.trim()) return null;
    return raw.trim();
  }

  private isTransversalWorkflowLocked(row: ControleRow): boolean {
    const st = this.readWorkflowStatut(row);
    if (st == null) return false;
    return st !== 'BROUILLON' && st !== 'RETOURNE';
  }

  private hasValidatorRole(roles: string[]): boolean {
    return this.auth.hasAnyRole([...roles, 'ADMIN', 'SUPER_ADMIN', 'SUPER_ROOT']);
  }

  private httpError(err: HttpErrorResponse): string {
    const body = err.error as { message?: string } | string | null;
    if (typeof body === 'object' && body?.message) {
      return body.message;
    }
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    return err.message || 'Une erreur est survenue.';
  }
}
