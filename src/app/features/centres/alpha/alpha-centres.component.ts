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
  CentreDetailRow,
  CentreRefDetails,
  IepOption,
  iepOptionLabel,
  LocaliteOption,
  localiteOptionLabel,
  NatureOption,
  natureOptionLabel,
  PeriodiciteOption,
  periodiciteOptionLabel,
  PromoteurUpsertPayload,
  promoteurDetailsFromApi,
  RefOption,
  refOptionLabel,
  SpringPage,
  TypePromoteur,
} from '@models/centre';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';

@Component({
  selector: 'app-alpha-centres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alpha-centres.component.html',
})
export class AlphaCentresComponent {
  readonly typePromoteurOptions: TypePromoteur[] = ['PHYSIQUE', 'MORALE'];
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
  typePersonneMoraleOptions: RefOption[] = [];
  promoteurMode: 'existing' | 'new' = 'existing';

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
    promoteur: { id: null, typePromoteur: null, libellePromoteur: '', personnePhysique: null, personneMorale: null },
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
  detailsModalOpen = false;
  detailsLoading = false;
  detailsRow: CentreDetailRow | null = null;
  editRowId: number | null = null;
  editLoading = false;
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
    idPromoteur: number | null;
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
    idPromoteur: null,
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
      rows: this.http.get<SpringPage<Record<string, unknown>>>(`${this.apiBaseUrl}/api/alpha`, {
        params: this.buildAlphaListParams(),
      }),
      campagnes: this.http.get<any[]>(`${this.apiBaseUrl}/api/campagnes`),
      categories: this.http.get<any[]>(`${this.apiBaseUrl}/api/categorie-centre-alpha`),
      typesAlpha: this.http.get<any[]>(`${this.apiBaseUrl}/api/TypeAlphas`),
      regimes: this.http.get<any[]>(`${this.apiBaseUrl}/api/Regimealphabetisations`),
      localites: this.http.get<LocaliteOption[]>(`${this.apiBaseUrl}/api/localite-d-implantation`),
      ieps: this.http.get<IepOption[]>(`${this.apiBaseUrl}/api/iep`),
      natures: this.http.get<NatureOption[]>(`${this.apiBaseUrl}/api/naturecentre`),
      periodicites: this.http.get<PeriodiciteOption[]>(`${this.apiBaseUrl}/api/Periodicites`),
      autorites: this.http.get<AutoriteOption[]>(`${this.apiBaseUrl}/api/autoriteautorisation`),
      promoteurs: this.http.get<any[]>(`${this.apiBaseUrl}/api/promoteur`),
      typePersonneMorales: this.http.get<any[]>(`${this.apiBaseUrl}/api/type-personne-morale`),
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
        this.typePersonneMoraleOptions = (res.typePersonneMorales ?? []).map((x: any) => ({
          id: x.id,
          code: undefined,
          libelle: x.libelle ?? undefined,
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
      if (this.promoteurMode === 'existing') {
        return this.model.promoteur.id != null;
      }
      if (!this.model.promoteur.typePromoteur) return false;
      if (this.model.promoteur.typePromoteur === 'MORALE') {
        return (this.model.promoteur.personneMorale?.idTypePersonneMorale ?? null) != null;
      }
      return true;
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
      promoteur: this.buildPromoteurPayload(),
      centre: { ...this.model.centre },
    };

    this.http.post(`${this.apiBaseUrl}/api/alpha`, payload).subscribe({
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
    this.detailsModalOpen = true;
    this.detailsLoading = true;
    this.detailsRow = null;
    this.errorMessage = null;
    this.http.get<Record<string, unknown>>(`${this.apiBaseUrl}/api/alpha/${row.idCentre}`).subscribe({
      next: (x) => {
        this.detailsRow = this.mapAlphaDetailFromApi(x);
        this.detailsLoading = false;
      },
      error: (e) => {
        this.detailsLoading = false;
        this.detailsModalOpen = false;
        this.errorMessage = this.formatError(e);
      },
    });
  }

  closeDetails(): void {
    this.detailsModalOpen = false;
    this.detailsRow = null;
    this.detailsLoading = false;
  }

  openEdit(row: AlphaRow): void {
    this.editRowId = row.idCentre;
    this.editLoading = true;
    this.errorMessage = null;
    this.http.get<Record<string, unknown>>(`${this.apiBaseUrl}/api/alpha/${row.idCentre}`).subscribe({
      next: (x) => {
        const d = this.mapAlphaDetailFromApi(x);
        this.editForm = {
          libelle: String(d.libelle ?? ''),
          idLocalite: d.idLocalite ?? null,
          idIep: d.idIep ?? null,
          idNaturecentre: d.idNaturecentre ?? null,
          idPeriodicite: d.idPeriodicite ?? null,
          idAutoriteAutorisation: d.idAutoriteAutorisation ?? null,
          autorisation: d.autorisation ?? null,
          aDeLeau: d.aDeLeau ?? null,
          estElectrifie: d.estElectrifie ?? null,
          nombreVisite: d.nombreVisite ?? null,
          localisationCentre: d.localisationCentre ?? null,
          nomMilieuImplentation: d.nomMilieuImplentation ?? null,
          encadreurNonMena: d.encadreurNonMena ?? null,
          encadrerParMena: d.encadrerParMena ?? null,
          idPromoteur: d.promoteur?.idPromoteur ?? d.idPromoteur ?? null,
        };
        this.editLoading = false;
      },
      error: (e) => {
        this.editLoading = false;
        this.editRowId = null;
        this.errorMessage = this.formatError(e);
      },
    });
  }

  closeEdit(): void {
    this.editRowId = null;
    this.editLoading = false;
  }

  canSaveEdit(): boolean {
    return !this.saving && !this.editLoading && this.editRowId != null && this.editForm.libelle.trim().length > 0;
  }

  saveEdit(): void {
    if (!this.canSaveEdit()) return;
    const id = this.editRowId!;
    this.saving = true;
    this.http.put(`${this.apiBaseUrl}/api/alpha/${id}/infos`, this.editForm).subscribe({
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
      promoteur: { id: null, typePromoteur: null, libellePromoteur: '', personnePhysique: null, personneMorale: null },
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
    this.promoteurMode = 'existing';
  }

  onPromoteurModeChange(): void {
    if (this.promoteurMode === 'existing') {
      this.model.promoteur = { id: null, typePromoteur: null, libellePromoteur: '', personnePhysique: null, personneMorale: null };
      return;
    }
    this.model.promoteur = {
      id: null,
      typePromoteur: 'PHYSIQUE',
      libellePromoteur: '',
      personnePhysique: { libellePersonnePhysique: '', nom: '', prenom: '', contact: '', fonction: '' },
      personneMorale: null,
    };
  }

  onTypePromoteurChange(): void {
    const t = this.model.promoteur.typePromoteur;
    if (t === 'MORALE') {
      this.model.promoteur.personneMorale = this.model.promoteur.personneMorale ?? {
        denomination: '',
        nomProgramme: '',
        nomRepresentant: '',
        contact: '',
        boitePostale: '',
        mail: '',
        idTypePersonneMorale: null,
      };
      this.model.promoteur.personnePhysique = null;
      return;
    }
    this.model.promoteur.personnePhysique = this.model.promoteur.personnePhysique ?? {
      libellePersonnePhysique: '',
      nom: '',
      prenom: '',
      contact: '',
      fonction: '',
    };
    this.model.promoteur.personneMorale = null;
  }

  deleteRow(row: AlphaRow): void {
    if (!confirm('Supprimer ce centre Alpha ?')) return;
    this.saving = true;
    this.http.delete(`${this.apiBaseUrl}/api/alpha/${row.idCentre}`).subscribe({
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
    const promoteur = promoteurDetailsFromApi(x['promoteur']);
    let idPromoteur: number | null = null;
    const rawPid = x['idPromoteur'];
    if (typeof rawPid === 'number' && Number.isFinite(rawPid)) {
      idPromoteur = rawPid;
    } else if (rawPid != null && String(rawPid).trim() !== '') {
      const n = Number(rawPid);
      if (Number.isFinite(n)) idPromoteur = n;
    }
    if (idPromoteur == null && promoteur?.idPromoteur != null) {
      idPromoteur = promoteur.idPromoteur;
    }
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
      idPromoteur,
      autorisation: (x['autorisation'] as boolean | null | undefined) ?? null,
      estElectrifie: (x['estElectrifie'] as boolean | null | undefined) ?? null,
      aDeLeau: this.pickBool(x, 'aDeLeau', 'adeLeau', 'ADeLeau'),
      nombreVisite: (x['nombreVisite'] as number | null | undefined) ?? null,
      localisationCentre: (x['localisationCentre'] as string | undefined) ?? null,
      nomMilieuImplentation: (x['nomMilieuImplentation'] as string | undefined) ?? null,
      encadreurNonMena: (x['encadreurNonMena'] as string | undefined) ?? null,
      encadrerParMena: (x['encadrerParMena'] as boolean | null | undefined) ?? null,
      promoteur,
    };
  }

  private mapAlphaDetailFromApi(x: Record<string, unknown>): CentreDetailRow {
    const base = this.mapAlphaRow(x);
    return {
      ...base,
      idCompagne: this.optionalPositiveInt(x['idCompagne']),
      idCategorieCentreAlpha: this.optionalPositiveInt(x['idCategorieCentreAlpha']),
      idTypeAlpha: this.optionalPositiveInt(x['idTypeAlpha']),
      idRegimeAlpha: this.optionalPositiveInt(x['idRegimeAlpha']),
      localite: this.asCentreRef(x['localite']),
      iep: this.asCentreRef(x['iep']),
      naturecentre: this.asCentreRef(x['naturecentre']),
      periodicite: this.asCentreRef(x['periodicite']),
      autoriteAutorisation: this.asCentreRef(x['autoriteAutorisation']),
      campagne: this.asCentreRef(x['campagne']),
      categorieCentreAlpha: this.asCentreRef(x['categorieCentreAlpha']),
      typeAlpha: this.asCentreRef(x['typeAlpha']),
      regimeAlpha: this.asCentreRef(x['regimeAlpha']),
    };
  }

  refCentreLabel(ref: CentreRefDetails | null | undefined, fallback: () => string): string {
    if (!ref) return fallback();
    const c = ref.code?.trim();
    const l = ref.libelle?.trim();
    if (c && l) return `${c} — ${l}`;
    if (c) return c;
    if (l) return l;
    if (ref.id != null) return `#${ref.id}`;
    return fallback();
  }

  detailLocaliteLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.localite, () => this.localiteLabel(d.idLocalite ?? null));
  }

  detailIepLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.iep, () => this.iepLabel(d.idIep ?? null));
  }

  detailNatureLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.naturecentre, () => this.natureLabel(d.idNaturecentre ?? null));
  }

  detailPeriodiciteLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.periodicite, () => this.periodiciteLabel(d.idPeriodicite ?? null));
  }

  detailAutoriteLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.autoriteAutorisation, () => this.autoriteLabel(d.idAutoriteAutorisation ?? null));
  }

  detailCampagneLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.campagne, () => this.campagneLabel(d.idCompagne ?? null));
  }

  detailCategorieAlphaLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.categorieCentreAlpha, () => this.categorieLabel(d.idCategorieCentreAlpha ?? null));
  }

  detailTypeAlphaLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.typeAlpha, () => this.typeAlphaLabel(d.idTypeAlpha ?? null));
  }

  detailRegimeAlphaLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.regimeAlpha, () => this.regimeLabel(d.idRegimeAlpha ?? null));
  }

  private pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean | null {
    for (const k of keys) {
      const v = obj[k];
      if (v === true || v === false) return v;
    }
    return null;
  }

  private optionalPositiveInt(v: unknown): number | null {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }

  private asCentreRef(value: unknown): CentreRefDetails | null {
    if (!value || typeof value !== 'object') return null;
    const o = value as Record<string, unknown>;
    const idRaw = o['id'];
    const id = typeof idRaw === 'number' ? idRaw : idRaw != null ? Number(idRaw) : null;
    return {
      id: id != null && Number.isFinite(id) ? id : null,
      code: (o['code'] as string | undefined) ?? null,
      libelle: (o['libelle'] as string | undefined) ?? null,
    };
  }

  promoteurSummary(row: AlphaRow): string {
    const p = row.promoteur;
    if (p) {
      const code = p.codePromoteur?.trim();
      const libelle = p.libellePromoteur?.trim();
      if (code && libelle) return `${code} — ${libelle}`;
      if (code || libelle) return (code || libelle) as string;
      if (p.idPromoteur != null) return `#${p.idPromoteur}`;
    }
    const id = row.idPromoteur;
    if (id != null) {
      const opt = this.promoteurs.find((x) => x.id === id);
      return opt ? this.refOptionLabel(opt) : `#${id}`;
    }
    return '—';
  }

  /** Libellé du promoteur choisi à l’étape 1 (récap wizard). */
  recapWizardExistingPromoteurLabel(): string {
    const id = this.model.promoteur?.id;
    if (id == null) return '—';
    const p = this.promoteurs.find((x) => x.id === id);
    return p ? this.refOptionLabel(p) : `#${id}`;
  }

  /** Libellé du type personne morale sélectionné (récap wizard). */
  recapWizardTypePersonneMoraleLabel(): string {
    const id = this.model.promoteur?.personneMorale?.idTypePersonneMorale;
    if (id == null) return '—';
    const t = this.typePersonneMoraleOptions.find((x) => x.id === id);
    return t ? this.refOptionLabel(t) : `#${id}`;
  }

  private buildPromoteurPayload(): PromoteurUpsertPayload {
    if (this.promoteurMode === 'existing') {
      return { id: this.model.promoteur.id ?? null };
    }
    return {
      libellePromoteur: String(this.model.promoteur.libellePromoteur ?? '').trim() || null,
      typePromoteur: this.model.promoteur.typePromoteur ?? null,
      personnePhysique: this.model.promoteur.personnePhysique ?? null,
      personneMorale: this.model.promoteur.personneMorale ?? null,
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

