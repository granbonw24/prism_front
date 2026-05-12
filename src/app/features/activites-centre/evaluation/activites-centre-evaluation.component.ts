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
};

type EvaluationForm = {
  idAlpha: number | null;
  idPeriodeEvaluation: number | null;
  idNiveauEvaluation: number | null;
  idThemeEvaluation: number | null;
  idTauxEvaluation: number | null;
};

@Component({
  selector: 'app-activites-centre-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './activites-centre-evaluation.component.html',
  styleUrl: './activites-centre-evaluation.component.css',
})
export class ActivitesCentreEvaluationComponent implements OnInit {
  rows: EvaluationRow[] = [];
  alphas: AlphaOption[] = [];
  periodes: Ref[] = [];
  niveaux: Ref[] = [];
  themes: Ref[] = [];
  taux: Ref[] = [];

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
        this.refLabel(row.themeEvaluation),
        this.refLabel(row.tauxEvaluation),
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
    return this.themes.filter((theme) => this.themeMatchesNiveau(theme, niveauCode));
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
      taux: this.http.get<unknown>(`${this.apiBaseUrl}/api/taux-evaluation`),
    }).subscribe({
      next: ({ evaluations, alphas, periodes, niveaux, themes, taux }) => {
        this.rows = unwrapListBody(evaluations) as EvaluationRow[];
        this.alphas = unwrapListBody(alphas) as AlphaOption[];
        this.periodes = unwrapListBody(periodes) as Ref[];
        this.niveaux = unwrapListBody(niveaux) as Ref[];
        this.themes = unwrapListBody(themes) as Ref[];
        this.taux = unwrapListBody(taux) as Ref[];
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
      idThemeEvaluation: row.themeEvaluation?.id ?? null,
      idTauxEvaluation: row.tauxEvaluation?.id ?? null,
    };
    this.formOpen = true;
    this.errorMessage = null;
    this.successMessage = null;
  }

  closeForm(): void {
    this.formOpen = false;
  }

  onNiveauChange(): void {
    if (!this.filteredThemes.some((theme) => theme.id === this.form.idThemeEvaluation)) {
      this.form.idThemeEvaluation = null;
    }
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
    if (!this.form.idThemeEvaluation) {
      this.errorMessage = 'Le thème/type d’évaluation est obligatoire.';
      return;
    }

    this.saving = true;
    const request =
      this.formMode === 'edit' && this.editingId != null
        ? this.http.put(`${this.apiBaseUrl}/api/evaluation/${this.editingId}`, this.form)
        : this.http.post(`${this.apiBaseUrl}/api/evaluation`, this.form);

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

  themeNiveauHint(theme: Ref): string {
    const niveau = this.normalizeText(theme.niveau);
    if (niveau === 'NIVEAU_1') return 'Niveau 1';
    if (niveau === 'NIVEAU_2') return 'Niveau 2';
    if (niveau === 'POST_ALPHA') return 'Post Alpha';
    return '';
  }

  themeOptionLabel(theme: Ref): string {
    const hint = this.themeNiveauHint(theme);
    return hint ? `${this.refLabel(theme)} (${hint})` : this.refLabel(theme);
  }

  private emptyForm(): EvaluationForm {
    return {
      idAlpha: null,
      idPeriodeEvaluation: null,
      idNiveauEvaluation: null,
      idThemeEvaluation: null,
      idTauxEvaluation: null,
    };
  }

  private normalizeNiveau(niveau: Ref | undefined): 'NIVEAU_1' | 'NIVEAU_2' | 'POST_ALPHA' | null {
    const value = this.normalizeText(`${niveau?.code ?? ''} ${niveau?.libelle ?? ''}`);
    if (value.includes('POST')) return 'POST_ALPHA';
    if (value.includes('2')) return 'NIVEAU_2';
    if (value.includes('1')) return 'NIVEAU_1';
    return null;
  }

  private themeMatchesNiveau(theme: Ref, niveau: 'NIVEAU_1' | 'NIVEAU_2' | 'POST_ALPHA'): boolean {
    const themeNiveau = this.normalizeText(theme.niveau);
    if (themeNiveau && themeNiveau !== niveau) {
      return false;
    }
    const label = this.normalizeText(`${theme.code ?? ''} ${theme.libelle ?? ''}`);
    if (label.includes('FORMATIVE')) return niveau === 'NIVEAU_1';
    if (label.includes('CERTIFICATIVE')) return niveau === 'NIVEAU_2' || niveau === 'POST_ALPHA';
    if (label.includes('SOMMATIVE')) return true;
    return true;
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
