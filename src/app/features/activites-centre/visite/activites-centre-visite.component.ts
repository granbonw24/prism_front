import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import type { SpringPage } from '@models/centre';
import type { VisitePayload, VisiteRow, VisiteSuiviMode } from '@models/visite';
import { AuthService } from '@services/auth.service';

type AlphaOption = {
  idCentre?: number | null;
  id?: number | null;
  codeCentre?: string | null;
  codeAlpha?: string | null;
  libelleAlpha?: string | null;
  libelle?: string | null;
};

type VisitePayloadFieldKey = Exclude<keyof VisitePayload, 'mode'>;

type VisiteField = {
  key: VisitePayloadFieldKey;
  label: string;
  type: 'text' | 'number';
};

type MaitriseFieldKey =
  | 'maitriseSeanceLecture'
  | 'maitriseSeanceEcriture'
  | 'maitriseSeanceCalcul'
  | 'maitriseSeanceCvc';

type MaitriseField = {
  key: MaitriseFieldKey;
  label: string;
};

type MaitriseResponse = 'BONNE' | 'MOYENNE' | 'MAUVAISE';
type VisiteFormMode = 'points' | 'suivi';
type CentralSource = 'Coordonnateur' | 'IEPP' | 'Superviseur';
type CentralRow = VisiteRow & { centralSource?: CentralSource };

const POINT_VISITE_FIELDS: MaitriseField[] = [
  { key: 'maitriseSeanceLecture', label: 'Maîtrise des séances de lecture' },
  { key: 'maitriseSeanceEcriture', label: 'Maîtrise des séances d’écriture' },
  { key: 'maitriseSeanceCalcul', label: 'Maîtrise des séances de calcul' },
  { key: 'maitriseSeanceCvc', label: 'Maîtrise des séances CVC' },
];

const MAITRISE_OPTIONS: Array<{ value: MaitriseResponse; label: string; hint: string }> = [
  { value: 'BONNE', label: 'Bonne', hint: 'Maîtrise satisfaisante' },
  { value: 'MOYENNE', label: 'Moyenne', hint: 'Maîtrise à consolider' },
  { value: 'MAUVAISE', label: 'Mauvaise', hint: 'Accompagnement requis' },
];

const SUIVI_FIELDS_BY_MODE: Record<VisiteSuiviMode, VisiteField[]> = {
  conseiller: [
    { key: 'nombreVisiteRealiseParConseiller', label: 'Nombre des visites réalisées', type: 'number' },
    { key: 'nombreBulletinEffectueParConseiller', label: 'Nombre de bulletins effectués', type: 'number' },
  ],
  superviseur: [
    { key: 'nombreVisiteConseillerSuperviseurEffectue', label: 'Nombre de visites effectuées', type: 'number' },
    { key: 'nombreReunionBilanConseillerSuperviseur', label: 'Nombre de réunions bilan', type: 'number' },
  ],
  centrale: [
    { key: 'nombreVisiteRealiseParConseiller', label: 'Visites conseiller', type: 'number' },
    { key: 'nombreBulletinEffectueParConseiller', label: 'Bulletins conseiller', type: 'number' },
    { key: 'nombreVisiteEffectueParIepp', label: 'Visites IEPP', type: 'number' },
    { key: 'nombreReunionPointActiviteAlpha', label: 'Réunions IEPP', type: 'number' },
    { key: 'nombreVisiteConseillerSuperviseurEffectue', label: 'Visites superviseur', type: 'number' },
    { key: 'nombreReunionBilanConseillerSuperviseur', label: 'Réunions bilan superviseur', type: 'number' },
  ],
  iepp: [
    { key: 'nombreVisiteEffectueParIepp', label: 'Nombre de visites effectuées', type: 'number' },
    {
      key: 'nombreReunionPointActiviteAlpha',
      label: 'Nombre de réunions sur les activités relatives à l’alphabétisation',
      type: 'number',
    },
  ],
};

const MODE_SUBTITLES: Record<VisiteSuiviMode, string> = {
  conseiller: 'Suivi du conseiller : visites réalisées et bulletins effectués.',
  superviseur: 'Suivi par le superviseur : visites effectuées et réunions bilan.',
  iepp: 'Suivi par l’IEPP : visites effectuées et réunions sur les activités d’alphabétisation.',
  centrale: 'Suivi central AENF : visites validées par le coordonnateur, suivis IEPP validés et suivis superviseur validés.',
};

const POINTS_VISITES_CREATE_PERMISSION = 'POINTS_VISITES:CREER';
const POINTS_VISITES_UPDATE_PERMISSION = 'POINTS_VISITES:MODIFIER';
const VALIDATION_COORDONNATEUR_PERMISSION = 'VALIDATION_VISITES_CONSEILLER:VALIDER';
const SUIVI_PERMISSION_BY_MODE: Record<VisiteSuiviMode, string> = {
  conseiller: 'SUIVI_CONSEILLER:MODIFIER',
  superviseur: 'SUIVI_SUPERVISEUR:MODIFIER',
  iepp: 'SUIVI_IEPP:MODIFIER',
  centrale: 'SUIVI_CENTRALE:LIRE',
};
const SUIVI_CREATE_PERMISSION_BY_MODE: Partial<Record<VisiteSuiviMode, string>> = {
  superviseur: 'SUIVI_SUPERVISEUR:CREER',
  iepp: 'SUIVI_IEPP:CREER',
};
const SUIVI_VALIDATE_PERMISSION_BY_MODE: Partial<Record<VisiteSuiviMode, string>> = {
  superviseur: 'SUIVI_SUPERVISEUR:VALIDER',
  iepp: 'SUIVI_IEPP:VALIDER',
};
const API_PATH_BY_MODE: Record<VisiteSuiviMode, string> = {
  conseiller: '/api/visite',
  superviseur: '/api/suivi-superviseur',
  iepp: '/api/suivi-iepp',
  centrale: '/api/suivi-superviseur',
};

@Component({
  selector: 'app-activites-centre-visite',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './activites-centre-visite.component.html',
  styleUrl: './activites-centre-visite.component.css',
})
export class ActivitesCentreVisiteComponent implements OnInit {
  pageTitle = 'ACTIVITES CENTRE — Visite';
  mode: VisiteSuiviMode = 'conseiller';
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  rows: CentralRow[] = [];
  alphas: AlphaOption[] = [];
  searchText = '';
  filterAlphaId: number | '' = '';

  createOpen = false;
  editTarget: VisiteRow | null = null;
  deleteTarget: VisiteRow | null = null;
  validationTarget: VisiteRow | null = null;
  form: VisitePayload = this.emptyForm();
  formMode: VisiteFormMode = 'suivi';

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
    private readonly auth: AuthService,
  ) {}

  ngOnInit(): void {
    const title = this.route.snapshot.data['title'];
    const mode = this.route.snapshot.data['mode'];
    if (typeof title === 'string' && title.trim()) {
      this.pageTitle = title.trim();
    }
    if (mode === 'conseiller' || mode === 'superviseur' || mode === 'iepp' || mode === 'centrale') {
      this.mode = mode;
    }
    this.reload();
  }

  get subtitle(): string {
    return MODE_SUBTITLES[this.mode];
  }

  get suiviFields(): VisiteField[] {
    return SUIVI_FIELDS_BY_MODE[this.mode];
  }

  get pointVisiteFields(): MaitriseField[] {
    return POINT_VISITE_FIELDS;
  }

  get showMaitriseColumns(): boolean {
    return this.mode === 'conseiller';
  }

  get tableColspan(): number {
    return 4 + this.suiviFields.length + (this.showMaitriseColumns ? this.pointVisiteFields.length : 0);
  }

  get maitriseOptions(): Array<{ value: MaitriseResponse; label: string; hint: string }> {
    return MAITRISE_OPTIONS;
  }

  get formTitle(): string {
    const action = this.editTarget ? 'Modifier' : 'Créer';
    return this.formMode === 'points' ? `${action} les points des visites` : `${action} le suivi de visite`;
  }

  get formDescription(): string {
    return this.formMode === 'points'
      ? 'Évaluez la maîtrise observée pendant les séances.'
      : this.subtitle;
  }

  get canCreatePoints(): boolean {
    return this.auth.hasPermission(POINTS_VISITES_CREATE_PERMISSION);
  }

  get canUpdatePoints(): boolean {
    return this.auth.hasPermission(POINTS_VISITES_UPDATE_PERMISSION);
  }

  get canManageSuivi(): boolean {
    return this.auth.hasPermission(SUIVI_PERMISSION_BY_MODE[this.mode]);
  }

  get canCreateSuivi(): boolean {
    const permission = SUIVI_CREATE_PERMISSION_BY_MODE[this.mode];
    return permission ? this.auth.hasPermission(permission) : false;
  }

  get canValidateCoordonnateur(): boolean {
    return this.mode === 'conseiller' && this.auth.hasPermission(VALIDATION_COORDONNATEUR_PERMISSION);
  }

  get canValidateSuivi(): boolean {
    const permission = SUIVI_VALIDATE_PERMISSION_BY_MODE[this.mode];
    return permission ? this.auth.hasPermission(permission) : false;
  }

  get filteredRows(): CentralRow[] {
    const q = this.searchText.trim().toLowerCase();
    return this.rows.filter((row) => {
      const alphaId = this.alphaId(row);
      if (this.filterAlphaId !== '' && alphaId !== Number(this.filterAlphaId)) {
        return false;
      }
      if (!q) {
        return true;
      }
      return [
        row.id,
        row.centralSource,
        row.alpha?.code,
        row.alpha?.libelle,
        row.maitriseSeanceLecture,
        row.maitriseSeanceEcriture,
        row.maitriseSeanceCalcul,
        row.maitriseSeanceCvc,
      ]
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }

  reload(): void {
    if (this.mode === 'centrale') {
      this.reloadCentrale();
      return;
    }
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      visites: this.http.get<VisiteRow[]>(`${this.apiBaseUrl}${this.apiPath()}`),
      alphas: this.http.get<SpringPage<AlphaOption> | AlphaOption[]>(`${this.apiBaseUrl}/api/alpha`, {
        params: new HttpParams().set('page', '0').set('size', '1000').set('sort', 'id,asc'),
      }),
    }).subscribe({
      next: ({ visites, alphas }) => {
        this.rows = (unwrapListBody(visites) as VisiteRow[]).sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0));
        this.alphas = unwrapListBody(alphas) as AlphaOption[];
        this.loading = false;
      },
      error: (err) => this.onError(err),
    });
  }

  private reloadCentrale(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      visites: this.http.get<VisiteRow[]>(`${this.apiBaseUrl}/api/visite`),
      suivisIepp: this.http.get<VisiteRow[]>(`${this.apiBaseUrl}/api/suivi-iepp`),
      suivisSuperviseur: this.http.get<VisiteRow[]>(`${this.apiBaseUrl}/api/suivi-superviseur`),
      alphas: this.http.get<SpringPage<AlphaOption> | AlphaOption[]>(`${this.apiBaseUrl}/api/alpha`, {
        params: new HttpParams().set('page', '0').set('size', '1000').set('sort', 'id,asc'),
      }),
    }).subscribe({
      next: ({ visites, suivisIepp, suivisSuperviseur, alphas }) => {
        const visitesValidees: CentralRow[] = (unwrapListBody(visites) as VisiteRow[])
          .filter((row) => Boolean(row.valideeCoordonnateur))
          .map((row) => ({ ...row, centralSource: 'Coordonnateur' }));
        const ieppValidees: CentralRow[] = (unwrapListBody(suivisIepp) as VisiteRow[])
          .filter((row) => Boolean(row.valideeIepp))
          .map((row) => ({ ...row, centralSource: 'IEPP' }));
        const superviseurValidees: CentralRow[] = (unwrapListBody(suivisSuperviseur) as VisiteRow[])
          .filter((row) => Boolean(row.valideeSuperviseur))
          .map((row) => ({ ...row, centralSource: 'Superviseur' }));
        this.rows = [...visitesValidees, ...ieppValidees, ...superviseurValidees]
          .sort((a, b) => this.centralSortKey(a).localeCompare(this.centralSortKey(b)));
        this.alphas = unwrapListBody(alphas) as AlphaOption[];
        this.loading = false;
      },
      error: (err) => this.onError(err),
    });
  }

  openCreate(mode: VisiteFormMode = 'suivi'): void {
    this.successMessage = null;
    this.errorMessage = null;
    if (mode === 'points' && this.mode !== 'conseiller') {
      this.errorMessage = 'Les points des visites sont enregistrés uniquement dans le flux conseiller.';
      return;
    }
    if (mode === 'suivi') {
      if (this.mode === 'conseiller') {
        this.errorMessage = 'Le suivi conseiller est calculé automatiquement à partir des lignes de visite.';
        return;
      }
      if (this.mode === 'centrale') {
        this.errorMessage = 'Le suivi central est consultatif.';
        return;
      }
      if (!this.canCreateSuivi) {
        this.errorMessage = 'Vous n’avez pas la permission de créer ce suivi.';
        return;
      }
      this.editTarget = null;
      this.formMode = mode;
      this.form = this.emptyForm();
      if (this.filterAlphaId !== '') {
        this.form.idAlpha = Number(this.filterAlphaId);
      }
      this.createOpen = true;
      return;
    }
    if (!this.canCreatePoints) {
      this.errorMessage = 'Vous n’avez pas la permission de créer les points des visites.';
      return;
    }
    this.editTarget = null;
    this.formMode = mode;
    this.form = this.emptyForm();
    if (this.filterAlphaId !== '') {
      this.form.idAlpha = Number(this.filterAlphaId);
    }
    this.createOpen = true;
  }

  openEdit(row: VisiteRow, mode: VisiteFormMode = 'suivi'): void {
    this.successMessage = null;
    this.errorMessage = null;
    if (mode === 'points' && this.mode !== 'conseiller') {
      this.errorMessage = 'Les points des visites sont enregistrés uniquement dans le flux conseiller.';
      return;
    }
    if (mode === 'points' && this.isConseillerLocked(row)) {
      this.errorMessage = 'Modification impossible : le superviseur a déjà effectué son suivi.';
      return;
    }
    if (mode === 'suivi' && this.isSuiviLocked(row)) {
      this.errorMessage = this.lockReason(row);
      return;
    }
    if (mode === 'suivi' && this.mode === 'centrale') {
      this.errorMessage = 'Le suivi central est consultatif.';
      return;
    }
    if (mode === 'points' && !this.canUpdatePoints) {
      this.errorMessage = 'Vous n’avez pas la permission de modifier les points des visites.';
      return;
    }
    if (mode === 'suivi' && !this.canManageSuivi) {
      this.errorMessage = 'Vous n’avez pas la permission de modifier ce suivi.';
      return;
    }
    this.createOpen = false;
    this.editTarget = row;
    this.formMode = mode;
    this.form = this.toPayload(row);
  }

  closeForm(): void {
    if (this.saving) {
      return;
    }
    this.createOpen = false;
    this.editTarget = null;
    this.formMode = 'suivi';
    this.form = this.emptyForm();
  }

  save(): void {
    if (this.saving) {
      return;
    }
    const payload = this.normalizePayload(this.form);
    if (!payload.idAlpha) {
      this.errorMessage = 'Le centre Alpha est obligatoire.';
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;

    const editId = this.editTarget?.id;
    if (this.formMode === 'points' && this.mode !== 'conseiller') {
      this.errorMessage = 'Les points des visites sont enregistrés uniquement dans le flux conseiller.';
      return;
    }
    if (this.formMode === 'suivi' && this.mode === 'conseiller' && editId == null) {
      this.errorMessage = 'Le suivi doit être mis à jour sur une ligne existante.';
      return;
    }
    if (this.formMode === 'points' && editId == null && !this.canCreatePoints) {
      this.errorMessage = 'Vous n’avez pas la permission de créer les points des visites.';
      return;
    }
    if (this.formMode === 'points' && editId != null && !this.canUpdatePoints) {
      this.errorMessage = 'Vous n’avez pas la permission d’enregistrer les points des visites.';
      return;
    }
    if (this.formMode === 'suivi' && editId == null && !this.canCreateSuivi) {
      this.errorMessage = 'Vous n’avez pas la permission de créer ce suivi.';
      return;
    }
    if (this.formMode === 'suivi' && editId != null && !this.canManageSuivi) {
      this.errorMessage = 'Vous n’avez pas la permission d’enregistrer ce suivi.';
      return;
    }
    payload.mode = this.formMode === 'points' ? 'points' : this.mode;
    const apiPayload = this.toApiPayload(payload);
    this.saving = true;
    const request$ = editId == null
      ? this.http.post<VisiteRow>(`${this.apiBaseUrl}${this.apiPath()}`, apiPayload)
      : this.http.put<VisiteRow>(`${this.apiBaseUrl}${this.apiPath()}/${encodeURIComponent(String(editId))}`, apiPayload);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.createOpen = false;
        this.editTarget = null;
        this.form = this.emptyForm();
        const label = this.formMode === 'points' ? 'Points des visites' : 'Suivi de visite';
        this.successMessage = editId == null ? `${label} créé.` : `${label} mis à jour.`;
        this.reload();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = this.formatError(err);
      },
    });
  }

  askDelete(row: VisiteRow): void {
    this.errorMessage = null;
    this.successMessage = null;
    this.deleteTarget = row;
  }

  closeDelete(): void {
    if (!this.saving) {
      this.deleteTarget = null;
    }
  }

  deleteConfirmed(): void {
    const id = this.deleteTarget?.id;
    if (id == null || this.saving) {
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    this.http.delete<void>(`${this.apiBaseUrl}${this.apiPath()}/${encodeURIComponent(String(id))}`).subscribe({
      next: () => {
        this.saving = false;
        this.deleteTarget = null;
        this.successMessage = 'Suivi de visite supprimé.';
        this.reload();
      },
      error: (err) => {
        this.saving = false;
        this.errorMessage = this.formatError(err);
      },
    });
  }

  askValidation(row: VisiteRow): void {
    if (!this.canValidateRow(row) || this.saving) {
      return;
    }
    this.errorMessage = null;
    this.successMessage = null;
    this.validationTarget = row;
  }

  closeValidation(): void {
    if (!this.saving) {
      this.validationTarget = null;
    }
  }

  validationConfirmed(): void {
    const target = this.validationTarget;
    if (!target || this.saving) {
      return;
    }
    this.validateRow(target);
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterAlphaId = '';
  }

  alphaId(row: VisiteRow): number | null {
    return row.alpha?.id ?? row.idAlpha ?? null;
  }

  centralSource(row: CentralRow): string {
    return row.centralSource ?? '—';
  }

  validationIndicator(row: CentralRow): string {
    if (this.mode === 'centrale') {
      if (row.centralSource === 'Coordonnateur') return 'Validé coordonnateur';
      if (row.centralSource === 'IEPP') return 'Validé IEPP';
      if (row.centralSource === 'Superviseur') return 'Validé superviseur';
      return 'Validé';
    }
    if (this.mode === 'conseiller') {
      return row.valideeCoordonnateur ? 'Validé coordonnateur' : 'En attente coordonnateur';
    }
    if (this.mode === 'iepp') {
      return row.valideeIepp ? 'Validé IEPP' : 'En attente IEPP';
    }
    if (this.mode === 'superviseur') {
      return row.valideeSuperviseur ? 'Validé superviseur' : 'En attente superviseur';
    }
    return '—';
  }

  validationIndicatorClass(row: CentralRow): string {
    if (this.mode === 'centrale' || this.isRowValidated(row)) {
      if (row.centralSource === 'Coordonnateur' || this.mode === 'conseiller') return 'validation-badge validation-coordonnateur';
      if (row.centralSource === 'IEPP' || this.mode === 'iepp') return 'validation-badge validation-iepp';
      if (row.centralSource === 'Superviseur' || this.mode === 'superviseur') return 'validation-badge validation-superviseur';
      return 'validation-badge validation-ok';
    }
    return 'validation-badge validation-pending';
  }

  alphaLabel(row: VisiteRow): string {
    const ref = row.alpha;
    if (!ref) {
      return '—';
    }
    return [ref.code, ref.libelle].filter(Boolean).join(' — ') || `Alpha #${ref.id ?? '—'}`;
  }

  alphaOptionValue(alpha: AlphaOption): number | null {
    return alpha.idCentre ?? alpha.id ?? null;
  }

  alphaOptionLabel(alpha: AlphaOption): string {
    const code = alpha.codeAlpha ?? alpha.codeCentre ?? null;
    const libelle = alpha.libelleAlpha ?? alpha.libelle ?? null;
    return [code, libelle].filter(Boolean).join(' — ') || `Alpha #${this.alphaOptionValue(alpha) ?? '—'}`;
  }

  fieldValue(row: VisiteRow, key: VisitePayloadFieldKey): string | number {
    return row[key] ?? '—';
  }

  canEditPoints(row: VisiteRow): boolean {
    return this.canUpdatePoints && !this.isConseillerLocked(row);
  }

  canEditSuivi(row: VisiteRow): boolean {
    return this.mode !== 'centrale' && this.canManageSuivi && !this.isSuiviLocked(row);
  }

  isConseillerLocked(row: VisiteRow): boolean {
    return Boolean(row.valideeCoordonnateur);
  }

  isSuiviLocked(row: VisiteRow): boolean {
    if (this.mode === 'conseiller') return Boolean(row.valideeCoordonnateur);
    if (this.mode === 'iepp') return Boolean(row.valideeIepp);
    if (this.mode === 'superviseur') return Boolean(row.valideeSuperviseur);
    return false;
  }

  lockReason(row: VisiteRow): string {
    if (this.mode === 'conseiller' && row.valideeCoordonnateur) {
      return 'Modification impossible : le coordonnateur a déjà validé cette visite.';
    }
    if (this.mode === 'iepp' && row.valideeIepp) {
      return 'Modification impossible : le suivi IEPP est déjà validé.';
    }
    if (this.mode === 'superviseur' && row.valideeSuperviseur) {
      return 'Modification impossible : le suivi superviseur est déjà validé.';
    }
    return '';
  }

  validateRow(row: VisiteRow): void {
    if (row.id == null || this.saving) return;
    const path = this.mode === 'conseiller' ? `${this.apiPath()}/${row.id}/valider-coordonnateur` : `${this.apiPath()}/${row.id}/valider`;
    this.saving = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.http.put<VisiteRow>(`${this.apiBaseUrl}${path}`, {}).subscribe({
      next: () => {
        this.saving = false;
        this.validationTarget = null;
        this.successMessage = 'Validation effectuée.';
        this.reload();
      },
      error: (err) => {
        this.saving = false;
        this.validationTarget = null;
        this.errorMessage = this.formatError(err);
      },
    });
  }

  canValidateRow(row: VisiteRow): boolean {
    return (this.canValidateCoordonnateur || this.canValidateSuivi) && !this.isRowValidated(row);
  }

  isRowValidated(row: VisiteRow): boolean {
    if (this.mode === 'conseiller') return Boolean(row.valideeCoordonnateur);
    if (this.mode === 'iepp') return Boolean(row.valideeIepp);
    if (this.mode === 'superviseur') return Boolean(row.valideeSuperviseur);
    return false;
  }

  maitriseValue(row: VisiteRow, key: MaitriseFieldKey): string {
    const value = row[key];
    return this.maitriseDisplayValue(value);
  }

  optionClass(value: MaitriseResponse): string {
    return `rating-${value.toLowerCase()}`;
  }

  deleteTargetLabel(): string {
    if (!this.deleteTarget) {
      return '';
    }
    return `${this.alphaLabel(this.deleteTarget)} (#${this.deleteTarget.id ?? '—'})`;
  }

  private onError(err: unknown): void {
    this.loading = false;
    this.errorMessage = this.formatError(err);
  }

  private apiPath(): string {
    return API_PATH_BY_MODE[this.mode];
  }

  private findSingleSuiviTarget(): VisiteRow | null {
    const candidates = this.filterAlphaId !== ''
      ? this.rows.filter((row) => this.alphaId(row) === Number(this.filterAlphaId))
      : this.filteredRows;
    return candidates.length === 1 ? candidates[0] : null;
  }

  private centralSortKey(row: CentralRow): string {
    const sourceOrder = row.centralSource === 'Coordonnateur' ? '1' : row.centralSource === 'IEPP' ? '2' : '3';
    return `${this.alphaLabel(row)}-${sourceOrder}-${String(row.id ?? '').padStart(8, '0')}`;
  }

  private emptyForm(): VisitePayload {
    return {
      mode: null,
      idAlpha: null,
      maitriseSeanceLecture: null,
      maitriseSeanceEcriture: null,
      maitriseSeanceCalcul: null,
      maitriseSeanceCvc: null,
      nombreVisiteRealiseParConseiller: null,
      nombreBulletinEffectueParConseiller: null,
      nombreVisiteConseillerSuperviseurEffectue: null,
      nombreReunionBilanConseillerSuperviseur: null,
      nombreVisiteEffectueParIepp: null,
      nombreReunionPointActiviteAlpha: null,
    };
  }

  private toPayload(row: VisiteRow): VisitePayload {
    return {
      ...this.emptyForm(),
      idAlpha: this.alphaId(row),
      maitriseSeanceLecture: row.maitriseSeanceLecture ?? null,
      maitriseSeanceEcriture: row.maitriseSeanceEcriture ?? null,
      maitriseSeanceCalcul: row.maitriseSeanceCalcul ?? null,
      maitriseSeanceCvc: row.maitriseSeanceCvc ?? null,
      nombreVisiteRealiseParConseiller: row.nombreVisiteRealiseParConseiller ?? null,
      nombreBulletinEffectueParConseiller: row.nombreBulletinEffectueParConseiller ?? null,
      nombreVisiteConseillerSuperviseurEffectue: row.nombreVisiteConseillerSuperviseurEffectue ?? null,
      nombreReunionBilanConseillerSuperviseur: row.nombreReunionBilanConseillerSuperviseur ?? null,
      nombreVisiteEffectueParIepp: row.nombreVisiteEffectueParIepp ?? null,
      nombreReunionPointActiviteAlpha: row.nombreReunionPointActiviteAlpha ?? null,
    };
  }

  private normalizePayload(payload: VisitePayload): VisitePayload {
    return {
      ...payload,
      mode: payload.mode ?? null,
      idAlpha: this.toNumberOrNull(payload.idAlpha),
      maitriseSeanceLecture: this.normalizeMaitriseResponse(payload.maitriseSeanceLecture),
      maitriseSeanceEcriture: this.normalizeMaitriseResponse(payload.maitriseSeanceEcriture),
      maitriseSeanceCalcul: this.normalizeMaitriseResponse(payload.maitriseSeanceCalcul),
      maitriseSeanceCvc: this.normalizeMaitriseResponse(payload.maitriseSeanceCvc),
      nombreVisiteRealiseParConseiller: this.toNumberOrNull(payload.nombreVisiteRealiseParConseiller),
      nombreBulletinEffectueParConseiller: this.toNumberOrNull(payload.nombreBulletinEffectueParConseiller),
      nombreVisiteConseillerSuperviseurEffectue: this.toNumberOrNull(payload.nombreVisiteConseillerSuperviseurEffectue),
      nombreReunionBilanConseillerSuperviseur: this.toNumberOrNull(payload.nombreReunionBilanConseillerSuperviseur),
      nombreVisiteEffectueParIepp: this.toNumberOrNull(payload.nombreVisiteEffectueParIepp),
      nombreReunionPointActiviteAlpha: this.toNumberOrNull(payload.nombreReunionPointActiviteAlpha),
    };
  }

  private toApiPayload(payload: VisitePayload): Partial<VisitePayload> {
    if (this.formMode === 'suivi' && this.mode === 'iepp') {
      return {
        idAlpha: payload.idAlpha,
        nombreVisiteEffectueParIepp: payload.nombreVisiteEffectueParIepp,
        nombreReunionPointActiviteAlpha: payload.nombreReunionPointActiviteAlpha,
      };
    }
    if (this.formMode === 'suivi' && this.mode === 'superviseur') {
      return {
        idAlpha: payload.idAlpha,
        nombreVisiteConseillerSuperviseurEffectue: payload.nombreVisiteConseillerSuperviseurEffectue,
        nombreReunionBilanConseillerSuperviseur: payload.nombreReunionBilanConseillerSuperviseur,
      };
    }
    return payload;
  }

  private normalizeMaitriseResponse(value: unknown): MaitriseResponse | null {
    if (value === 'BONNE' || value === 'MOYENNE' || value === 'MAUVAISE') {
      return value;
    }
    const normalized = String(value ?? '').trim().toUpperCase();
    if (normalized === 'OUI') return 'BONNE';
    if (normalized === 'NON') return 'MAUVAISE';
    return normalized === 'BONNE' || normalized === 'MOYENNE' || normalized === 'MAUVAISE' ? normalized : null;
  }

  private maitriseDisplayValue(value: unknown): string {
    const normalized = this.normalizeMaitriseResponse(value);
    if (normalized === 'BONNE') return 'Bonne';
    if (normalized === 'MOYENNE') return 'Moyenne';
    if (normalized === 'MAUVAISE') return 'Mauvaise';
    return value ? String(value) : '—';
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private formatError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const message = typeof err.error?.message === 'string' ? err.error.message : '';
      return message ? `Erreur serveur: ${err.status} ${err.statusText} — ${message}` : `Erreur serveur: ${err.status} ${err.statusText}`;
    }
    return err instanceof Error ? err.message : 'Erreur inconnue';
  }
}
