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
  periodeEvaluation?: Ref | null;
  niveauEvaluation?: Ref | null;
  themeEvaluation?: Ref | null;
  tauxEvaluation?: Ref | null;
  typeEvaluation?: TypeEvaluation | string | null;
  themesTaux?: ThemeTauxRow[] | null;
};

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
  idPeriodeEvaluation: number | null;
  idNiveauEvaluation: number | null;
  typeEvaluation: TypeEvaluation | null;
  themesTaux: ThemeTauxForm[];
};

@Component({
  selector: 'app-activites-centre-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  formOpen = false;
  formMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;
  searchText = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;
  form: EvaluationForm = this.emptyForm();

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  get canCreate(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_EVALUATION:CREER');
  }

  get canEdit(): boolean {
    return this.auth.hasPermission('ACTIVITES_CENTRE_EVALUATION:MODIFIER');
  }

  get filteredRows(): EvaluationRow[] {
    const q = this.searchText.trim().toLowerCase();
    if (!q) return this.rows;
    return this.rows.filter((row) =>
      [
        row.id,
        this.refLabel(row.alpha),
        this.refLabel(row.periodeEvaluation),
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
      alphas: this.http.post<unknown>(`${this.apiBaseUrl}/api/alpha/search`, {}),
      periodes: this.http.get<unknown>(`${this.apiBaseUrl}/api/periodes-evaluation`),
      niveaux: this.http.get<unknown>(`${this.apiBaseUrl}/api/niveaux-evaluation`),
      themes: this.http.get<unknown>(`${this.apiBaseUrl}/api/themes-evaluation`),
    }).subscribe({
      next: ({ evaluations, alphas, periodes, niveaux, themes }) => {
        this.rows = unwrapListBody(evaluations) as EvaluationRow[];
        this.alphas = unwrapListBody(alphas) as AlphaOption[];
        this.periodes = unwrapListBody(periodes) as Ref[];
        this.niveaux = unwrapListBody(niveaux) as Ref[];
        this.themes = unwrapListBody(themes) as Ref[];
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
    this.formOpen = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  openEdit(row: EvaluationRow): void {
    if (!this.canEdit) return;
    this.formMode = 'edit';
    this.editingId = row.id ?? null;
    this.form = {
      idAlpha: row.alpha?.id ?? null,
      idPeriodeEvaluation: row.periodeEvaluation?.id ?? null,
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
        ? this.http.put(`${this.apiBaseUrl}/api/evaluation/${this.editingId}`, payload)
        : this.http.post(`${this.apiBaseUrl}/api/evaluation`, payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.formOpen = false;
        this.successMessage = this.formMode === 'edit' ? 'Évaluation modifiée.' : 'Évaluation enregistrée.';
        this.reload();
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.errorMessage = this.httpError(err);
      },
    });
  }

  deleteRow(row: EvaluationRow): void {
    if (!this.canEdit || row.id == null) return;
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

  alphaOptionId(alpha: AlphaOption): number | null {
    return alpha.idCentre ?? alpha.id ?? null;
  }

  alphaOptionLabel(alpha: AlphaOption): string {
    return [alpha.codeCentre ?? alpha.code, alpha.libelle].filter(Boolean).join(' — ') || `Centre ${this.alphaOptionId(alpha) ?? ''}`;
  }

  refLabel(ref: Ref | null | undefined): string {
    if (!ref) return '-';
    return [ref.code, ref.libelle].filter(Boolean).join(' — ') || `#${ref.id ?? ''}`;
  }

  typeLabel(type: TypeEvaluation | string | null | undefined): string {
    if (type === 'FORMATIVE') return 'Formative';
    if (type === 'SOMMATIVE') return 'Sommative';
    if (type === 'CERTIFICATIVE') return 'Certificative';
    return '-';
  }

  themesTauxLabel(row: EvaluationRow): string {
    const rows = row.themesTaux ?? [];
    if (rows.length > 0) {
      return rows.map((item) => `${this.refLabel(item.themeEvaluation)} : ${item.taux ?? '-'}%`).join(' | ');
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
    const hint = this.themeNiveauHint(theme);
    return hint ? `${this.refLabel(theme)} (${hint})` : this.refLabel(theme);
  }

  private emptyForm(): EvaluationForm {
    return {
      idAlpha: null,
      idPeriodeEvaluation: null,
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
