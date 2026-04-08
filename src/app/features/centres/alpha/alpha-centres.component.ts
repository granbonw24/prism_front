import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  AlphaFullCreatePayload,
  AlphaRow,
  AutoriteOption,
  autoriteOptionLabel,
  IepOption,
  iepOptionLabel,
  LocaliteOption,
  localiteOptionLabel,
  NatureOption,
  natureOptionLabel,
  PeriodiciteOption,
  periodiciteOptionLabel,
  RefOption,
  refOptionLabel,
  SpringPage,
} from '@models/centre';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';

@Component({
  selector: 'app-alpha-centres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alpha-centres.component.html',
})
export class AlphaCentresComponent {
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  rows: AlphaRow[] = [];
  campagnes: RefOption[] = [];
  categories: RefOption[] = [];
  typesAlpha: RefOption[] = [];
  regimes: RefOption[] = [];

  localites: LocaliteOption[] = [];
  ieps: IepOption[] = [];
  natures: NatureOption[] = [];
  periodicites: PeriodiciteOption[] = [];
  autorites: AutoriteOption[] = [];
  promoteurs: RefOption[] = [];

  /** Exposés au template pour les libellés des &lt;select&gt; filtres. */
  readonly refOptionLabel = refOptionLabel;
  readonly localiteOptionLabel = localiteOptionLabel;
  readonly iepOptionLabel = iepOptionLabel;
  readonly natureOptionLabel = natureOptionLabel;
  readonly periodiciteOptionLabel = periodiciteOptionLabel;
  readonly autoriteOptionLabel = autoriteOptionLabel;

  stepIndex = 0;

  model: AlphaFullCreatePayload = {
    campagneId: null as any,
    categorieCentreAlphaId: null as any,
    typeAlphaId: null as any,
    regimeAlphaId: null as any,
    libelleAlpha: '',
    promoteur: { libellePromoteur: '' },
    centre: {
      localiteId: null as any,
      periodiciteId: null,
      iepId: null as any,
      autoriteAutorisationId: null,
      natureCentreId: null as any,
      autorisation: true,
      encadreurNonMena: '',
      encadrerParMena: true,
      estElectrifie: false,
      aDeLeau: false,
      nombreVisite: 0,
      localisationCentre: '',
      nomMilieuImplentation: '',
    },
  };

  // Détails / édition (modales)
  detailsRow: AlphaRow | null = null;
  editRowId: number | null = null;
  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  /** Recherche rapide → paramètre API `q` (OR sur plusieurs colonnes + id si entier). */
  searchQ = '';

  /** Filtres liste (noms alignés sur l’API query). */
  alphaListFilter: Record<string, string> = {
    idCompagne: '',
    idCategorieCentreAlpha: '',
    idTypeAlpha: '',
    idRegimeAlpha: '',
    idLocalite: '',
    idPeriodicite: '',
    idIep: '',
    idAutoriteAutorisation: '',
    idNaturecentre: '',
    idPromoteur: '',
    codeCentre: '',
    codeAlpha: '',
    libelleAlpha: '',
    encadreurNonMena: '',
    localisationCentre: '',
    nomMilieuImplentation: '',
    autorisation: '',
    encadrerParMena: '',
    estElectrifie: '',
    aDeLeau: '',
    nombreVisite: '',
  };

  editForm: {
    libelle: string;
    idLocalite: number | null;
    idIep: number | null;
    idNaturecentre: number | null;
    idPeriodicite: number | null;
    idAutoriteAutorisation: number | null;
    autorisation: boolean | null;
    aDeLeau: boolean | null;
    estElectrifie: boolean | null;
    nombreVisite: number | null;
    localisationCentre: string | null;
    nomMilieuImplentation: string | null;
    encadreurNonMena: string | null;
    encadrerParMena: boolean | null;
  } = {
    libelle: '',
    idLocalite: null,
    idIep: null,
    idNaturecentre: null,
    idPeriodicite: null,
    idAutoriteAutorisation: null,
    autorisation: null,
    aDeLeau: null,
    estElectrifie: null,
    nombreVisite: null,
    localisationCentre: null,
    nomMilieuImplentation: null,
    encadreurNonMena: null,
    encadrerParMena: null,
  };

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      rows: this.http.get<SpringPage<Record<string, unknown>>>(`${this.apiBaseUrl}/api/v1/alpha`, {
        params: this.buildAlphaListParams(),
      }),
      campagnes: this.http.get<any[]>(`${this.apiBaseUrl}/api/campagnes`),
      categories: this.http.get<any[]>(`${this.apiBaseUrl}/api/categorie-centre-alpha`),
      typesAlpha: this.http.get<any[]>(`${this.apiBaseUrl}/api/v1/TypeAlphas`),
      regimes: this.http.get<any[]>(`${this.apiBaseUrl}/api/v1/Regimealphabetisations`),
      localites: this.http.get<LocaliteOption[]>(`${this.apiBaseUrl}/api/localite-d-implantation`),
      ieps: this.http.get<IepOption[]>(`${this.apiBaseUrl}/api/iep`),
      natures: this.http.get<NatureOption[]>(`${this.apiBaseUrl}/api/naturecentre`),
      periodicites: this.http.get<PeriodiciteOption[]>(`${this.apiBaseUrl}/api/v1/Periodicites`),
      autorites: this.http.get<AutoriteOption[]>(`${this.apiBaseUrl}/api/autoriteautorisation`),
      promoteurs: this.http.get<any[]>(`${this.apiBaseUrl}/api/promoteur`),
    }).subscribe({
      next: (res) => {
        const page = res.rows;
        const list = page.content ?? [];
        this.totalElements = page.totalElements ?? 0;
        this.totalPages = page.totalPages ?? 0;
        this.rows = list.map((x) => this.mapAlphaRow(x));
        this.campagnes = (res.campagnes ?? []).map((x: any) => ({
          id: x.id,
          code: x.codeCampagne ?? undefined,
          libelle:
            x.dateDebutCampagne != null && x.dateFinCampagne != null
              ? `${x.dateDebutCampagne} → ${x.dateFinCampagne}`
              : undefined,
        }));
        this.categories = (res.categories ?? []).map((x: any) => ({
          id: x.id,
          code: x.codeCategorieCentreAlpha ?? undefined,
          libelle: x.libelleCategorieCentreAlpha ?? undefined,
        }));
        this.typesAlpha = (res.typesAlpha ?? []).map((x: any) => ({
          id: x.id,
          code: x.codeTypeAlpha ?? undefined,
          libelle: x.libelleTypeAlpha ?? undefined,
        }));
        this.regimes = (res.regimes ?? []).map((x: any) => ({
          id: x.id,
          code: x.codeRegimeAlpha ?? undefined,
          libelle: x.libelleRegimeAlpha ?? undefined,
        }));
        this.localites = res.localites ?? [];
        this.ieps = res.ieps ?? [];
        this.natures = res.natures ?? [];
        this.periodicites = res.periodicites ?? [];
        this.autorites = res.autorites ?? [];
        this.promoteurs = (res.promoteurs ?? []).map((x: any) => ({
          id: x.id,
          code: x.codePromoteur ?? undefined,
          libelle: x.libellePromoteur ?? undefined,
        }));
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  canGoNext(): boolean {
    if (this.saving) return false;
    if (this.stepIndex === 0) {
      return (
        String(this.model.promoteur.libellePromoteur ?? '').trim().length > 0
      );
    }
    if (this.stepIndex === 1) {
      const c = this.model.centre;
      return (
        c.localiteId != null &&
        c.iepId != null &&
        c.natureCentreId != null
      );
    }
    if (this.stepIndex === 2) {
      return (
        this.model.campagneId != null &&
        this.model.categorieCentreAlphaId != null &&
        this.model.typeAlphaId != null &&
        this.model.regimeAlphaId != null &&
        String(this.model.libelleAlpha ?? '').trim().length > 0
      );
    }
    return false;
  }

  canSubmit(): boolean {
    return !this.saving && this.stepIndex === 3;
  }

  next(): void {
    if (!this.canGoNext()) return;
    this.stepIndex = Math.min(3, this.stepIndex + 1);
  }

  prev(): void {
    if (this.saving) return;
    this.stepIndex = Math.max(0, this.stepIndex - 1);
  }

  goTo(i: number): void {
    if (this.saving) return;
    // navigation contrôlée : on peut revenir librement, mais avancer seulement si l'étape actuelle est valide
    if (i <= this.stepIndex) {
      this.stepIndex = i;
      return;
    }
    if (i === this.stepIndex + 1 && this.canGoNext()) {
      this.stepIndex = i;
    }
  }

  localiteLabel(id: number | null | undefined): string {
    const found = this.localites.find((x) => x.id === id);
    if (!found) return '—';
    return `${found.codeLocalite ?? 'LOC'} · ${found.nomLocalite ?? ''}`.trim();
  }

  iepLabel(id: number | null | undefined): string {
    const found = this.ieps.find((x) => x.id === id);
    if (!found) return '—';
    return `${found.codeIep ?? 'IEP'} · ${found.nomIep ?? ''}`.trim();
  }

  natureLabel(id: number | null | undefined): string {
    const found = this.natures.find((x) => x.id === id);
    if (!found) return '—';
    return `${found.codeNatureCentre ?? 'NAT'} · ${found.libelleNatureCentre ?? ''}`.trim();
  }

  periodiciteLabel(id: number | null | undefined): string {
    const found = this.periodicites.find((x) => x.id === id);
    if (!found) return '—';
    return `${found.codePeriodicite ?? 'PER'} · ${found.libellePeriodicite ?? ''}`.trim();
  }

  autoriteLabel(id: number | null | undefined): string {
    const found = this.autorites.find((x) => x.id === id);
    if (!found) return '—';
    return `${found.codeAutorisation ?? 'AUT'} · ${found.libelleAutoriteAutorisation ?? ''}`.trim();
  }

  campagneLabel(id: number | null | undefined): string {
    const found = this.campagnes.find((x) => x.id === id);
    return found ? this.refOptionLabel(found) : '—';
  }

  categorieLabel(id: number | null | undefined): string {
    const found = this.categories.find((x) => x.id === id);
    return found ? this.refOptionLabel(found) : '—';
  }

  typeAlphaLabel(id: number | null | undefined): string {
    const found = this.typesAlpha.find((x) => x.id === id);
    return found ? this.refOptionLabel(found) : '—';
  }

  regimeLabel(id: number | null | undefined): string {
    const found = this.regimes.find((x) => x.id === id);
    return found ? this.refOptionLabel(found) : '—';
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.saving = true;
    this.errorMessage = null;
    const payload: AlphaFullCreatePayload = {
      campagneId: this.model.campagneId,
      categorieCentreAlphaId: this.model.categorieCentreAlphaId,
      typeAlphaId: this.model.typeAlphaId,
      regimeAlphaId: this.model.regimeAlphaId,
      libelleAlpha: this.model.libelleAlpha,
      promoteur: { libellePromoteur: String(this.model.promoteur.libellePromoteur ?? '').trim() },
      centre: { ...this.model.centre },
    };

    this.http.post(`${this.apiBaseUrl}/api/v1/alpha/full`, payload).subscribe({
      next: () => {
        this.saving = false;
        this.resetWizard();
        this.loadAll();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  openDetails(row: AlphaRow): void {
    this.detailsRow = row;
  }

  closeDetails(): void {
    this.detailsRow = null;
  }

  openEdit(row: AlphaRow): void {
    this.editRowId = row.idCentre;
    this.editForm = {
      libelle: String(row.libelle ?? ''),
      idLocalite: row.idLocalite ?? null,
      idIep: row.idIep ?? null,
      idNaturecentre: row.idNaturecentre ?? null,
      idPeriodicite: row.idPeriodicite ?? null,
      idAutoriteAutorisation: row.idAutoriteAutorisation ?? null,
      autorisation: row.autorisation ?? null,
      aDeLeau: row.aDeLeau ?? null,
      estElectrifie: row.estElectrifie ?? null,
      nombreVisite: row.nombreVisite ?? null,
      localisationCentre: row.localisationCentre ?? null,
      nomMilieuImplentation: row.nomMilieuImplentation ?? null,
      encadreurNonMena: row.encadreurNonMena ?? null,
      encadrerParMena: row.encadrerParMena ?? null,
    };
  }

  closeEdit(): void {
    this.editRowId = null;
  }

  canSaveEdit(): boolean {
    return !this.saving && this.editRowId != null && this.editForm.libelle.trim().length > 0;
  }

  saveEdit(): void {
    if (!this.canSaveEdit()) return;
    const id = this.editRowId!;
    this.saving = true;
    this.http.put(`${this.apiBaseUrl}/api/v1/alpha/${id}/infos`, this.editForm).subscribe({
      next: () => {
        this.saving = false;
        this.closeEdit();
        this.loadAll();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  resetWizard(): void {
    this.stepIndex = 0;
    this.model = {
      campagneId: null as any,
      categorieCentreAlphaId: null as any,
      typeAlphaId: null as any,
      regimeAlphaId: null as any,
      libelleAlpha: '',
      promoteur: { libellePromoteur: '' },
      centre: {
        localiteId: null as any,
        periodiciteId: null,
        iepId: null as any,
        autoriteAutorisationId: null,
        natureCentreId: null as any,
        autorisation: true,
        encadreurNonMena: '',
        encadrerParMena: true,
        estElectrifie: false,
        aDeLeau: false,
        nombreVisite: 0,
        localisationCentre: '',
        nomMilieuImplentation: '',
      },
    };
  }

  deleteRow(row: AlphaRow): void {
    if (!confirm('Supprimer ce centre Alpha ?')) return;
    this.saving = true;
    this.http.delete(`${this.apiBaseUrl}/api/v1/alpha/${row.idCentre}`).subscribe({
      next: () => {
        this.saving = false;
        this.loadAll();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  private buildAlphaListParams(): HttpParams {
    let p = new HttpParams()
      .set('page', String(this.pageIndex))
      .set('size', String(this.pageSize))
      .set('sort', 'id,asc');
    const q = String(this.searchQ ?? '').trim();
    if (q !== '') {
      p = p.set('q', q);
    }
    for (const [key, val] of Object.entries(this.alphaListFilter)) {
      const s = String(val ?? '').trim();
      if (s !== '') {
        p = p.set(key, s);
      }
    }
    return p;
  }

  private mapAlphaRow(x: Record<string, unknown>): AlphaRow {
    return {
      idCentre: Number(x['idCentre'] ?? x['id'] ?? 0),
      codeCentre: (x['codeCentre'] as string | undefined) ?? null,
      codeType: (x['codeType'] as string | undefined) ?? null,
      libelle: (x['libelle'] as string | undefined) ?? null,
      idLocalite: (x['idLocalite'] as number | null | undefined) ?? null,
      idIep: (x['idIep'] as number | null | undefined) ?? null,
      idNaturecentre: (x['idNaturecentre'] as number | null | undefined) ?? null,
      idPeriodicite: (x['idPeriodicite'] as number | null | undefined) ?? null,
      idAutoriteAutorisation: (x['idAutoriteAutorisation'] as number | null | undefined) ?? null,
      autorisation: (x['autorisation'] as boolean | null | undefined) ?? null,
      estElectrifie: (x['estElectrifie'] as boolean | null | undefined) ?? null,
      aDeLeau: (x['aDeLeau'] as boolean | null | undefined) ?? null,
      nombreVisite: (x['nombreVisite'] as number | null | undefined) ?? null,
      localisationCentre: (x['localisationCentre'] as string | undefined) ?? null,
      nomMilieuImplentation: (x['nomMilieuImplentation'] as string | undefined) ?? null,
      encadreurNonMena: (x['encadreurNonMena'] as string | undefined) ?? null,
      encadrerParMena: (x['encadrerParMena'] as boolean | null | undefined) ?? null,
    };
  }

  applyListFilters(): void {
    this.pageIndex = 0;
    this.loadAll();
  }

  resetListFilters(): void {
    this.searchQ = '';
    for (const k of Object.keys(this.alphaListFilter)) {
      this.alphaListFilter[k] = '';
    }
    this.pageIndex = 0;
    this.loadAll();
  }

  goPrevPage(): void {
    if (!this.canGoPrevPage()) return;
    this.pageIndex--;
    this.loadAll();
  }

  goNextPage(): void {
    if (!this.canGoNextPage()) return;
    this.pageIndex++;
    this.loadAll();
  }

  /** Pagination toujours utilisable côté UI (évite totalPages === 0 renvoyé par Spring sur liste vide). */
  canGoPrevPage(): boolean {
    return !this.loading && this.pageIndex > 0;
  }

  canGoNextPage(): boolean {
    if (this.loading) return false;
    const tp = this.totalPages;
    if (tp == null || tp < 2) return false;
    return this.pageIndex < tp - 1;
  }

  get displayTotalPages(): number {
    return this.totalPages > 0 ? this.totalPages : 1;
  }

  onPageSizeChange(): void {
    this.pageIndex = 0;
    this.loadAll();
  }

  private formatError(e: unknown): string {
    const anyE = e as any;
    return String(
      anyE?.error?.message ??
        anyE?.message ??
        'Erreur inattendue. Vérifiez la console et le backend.',
    );
  }
}

