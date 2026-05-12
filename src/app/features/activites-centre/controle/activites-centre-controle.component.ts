import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '@services/auth.service';

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
  niveauAlpha?: Ref | null;
  dateDemarrageAppren?: string | null;
  conformiteProgramme?: boolean | null;
  valideeCoordonnateur?: boolean | null;
  valideeSuperviseur?: boolean | null;
  valideeCentrale?: boolean | null;
  horairesFormation?: HoraireRow[] | null;
  kitsManuels?: KitRow[] | null;
};

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
  imports: [CommonModule, FormsModule],
  templateUrl: './activites-centre-controle.component.html',
  styleUrl: './activites-centre-controle.component.css',
})
export class ActivitesCentreControleComponent implements OnInit {
  rows: ControleRow[] = [];
  alphas: AlphaOption[] = [];
  niveaux: Ref[] = [];
  manuels: Ref[] = [];

  loading = false;
  saving = false;
  validatingId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  searchText = '';
  filterAlphaId: number | '' = '';

  formOpen = false;
  formMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;
  form: ControleForm = this.emptyForm();

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

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
      if (!q) {
        return true;
      }
      return [
        row.id,
        this.alphaLabel(row),
        row.niveauAlpha?.code ?? row.niveauAlpha?.codeNiveauAlpha,
        row.niveauAlpha?.libelle ?? row.niveauAlpha?.libelleNiveauAlpha,
        row.dateDemarrageAppren,
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
      alphas: this.http.post<unknown>(`${this.apiBaseUrl}/api/alpha/search`, {}),
      niveaux: this.http.get<unknown>(`${this.apiBaseUrl}/api/niveaualpha`),
      manuels: this.http.get<unknown>(`${this.apiBaseUrl}/api/manuels`),
    }).subscribe({
      next: ({ controles, alphas, niveaux, manuels }) => {
        this.rows = unwrapListBody(controles) as ControleRow[];
        this.alphas = unwrapListBody(alphas) as AlphaOption[];
        this.niveaux = unwrapListBody(niveaux) as Ref[];
        this.manuels = unwrapListBody(manuels) as Ref[];
        this.loading = false;
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
        ? this.http.put(`${this.apiBaseUrl}/api/controle/${this.editingId}`, payload)
        : this.http.post(`${this.apiBaseUrl}/api/controle`, payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.formOpen = false;
        this.successMessage = this.formMode === 'edit' ? 'Contrôle modifié.' : 'Contrôle enregistré.';
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

  clearFilters(): void {
    this.searchText = '';
    this.filterAlphaId = '';
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
    if (this.form.idAlpha == null) {
      return this.niveaux;
    }
    return this.niveaux.filter((niveau) => niveau.alpha?.id === this.form.idAlpha);
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
    return 'En attente coordonnateur';
  }

  validationClass(row: ControleRow): string {
    if (row.valideeCentrale) return 'badge-success';
    if (row.valideeSuperviseur) return 'badge-primary';
    if (row.valideeCoordonnateur) return 'badge-info';
    return 'badge-secondary';
  }

  isLocked(row: ControleRow): boolean {
    return Boolean(row.valideeCoordonnateur || row.valideeSuperviseur || row.valideeCentrale);
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
    dateDemarrageAppren: string;
    idNiveauAlpha: number | null;
    conformiteProgramme: boolean | null;
    horairesFormation: Array<{ jourSemaine: string; heureDebut: string; heureFin: string }>;
    kitsManuels: Array<{ idManuel: number; nombreKit: number; precisionAutre: string | null }>;
  } {
    return {
      idAlpha: this.form.idAlpha,
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
    if (!row.valideeCoordonnateur && this.hasValidatorRole(['COORDONNATEUR'])) return 'valider-coordonnateur';
    if (row.valideeCoordonnateur && !row.valideeSuperviseur && this.hasValidatorRole(['SUPERVISEUR'])) {
      return 'valider-superviseur';
    }
    if (row.valideeSuperviseur && !row.valideeCentrale && this.hasValidatorRole(['SUPERVISEUR_AENF', 'DIRECTEUR'])) {
      return 'valider-centrale';
    }
    return null;
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
