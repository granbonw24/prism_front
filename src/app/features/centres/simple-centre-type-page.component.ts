import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AutoriteOption,
  autoriteOptionLabel,
  CentreDetailRow,
  CentreRefDetails,
  CentreRow as Row,
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
  SimpleCentreFullCreatePayload as SimpleFullCreatePayload,
  SpringPage,
  TypePromoteur,
} from '@models/centre';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';

@Component({
  selector: 'app-simple-centre-type-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simple-centre-type-page.component.html',
})
export class SimpleCentreTypePageComponent implements OnInit {
  readonly typePromoteurOptions: TypePromoteur[] = ['PHYSIQUE', 'MORALE'];
  @Input({ required: true }) title!: string;
  @Input({ required: true }) apiPath!: string;

  loading = false;
  saving = false;
  errorMessage: string | null = null;

  rows: Row[] = [];
  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  /** Recherche rapide → paramètre API `q`. */
  searchQ = '';

  /** Filtres liste ; `libelle` est mappé vers libelleCec / libellleCp / libelleSie selon `apiPath`. */
  simpleListFilter: Record<string, string> = {
    idLocalite: '',
    idPeriodicite: '',
    idIep: '',
    idAutoriteAutorisation: '',
    idNaturecentre: '',
    idPromoteur: '',
    codeCentre: '',
    libelle: '',
    encadreurNonMena: '',
    localisationCentre: '',
    nomMilieuImplentation: '',
    autorisation: '',
    encadrerParMena: '',
    estElectrifie: '',
    aDeLeau: '',
    nombreVisite: '',
  };

  localites: LocaliteOption[] = [];
  ieps: IepOption[] = [];
  natures: NatureOption[] = [];
  periodicites: PeriodiciteOption[] = [];
  autorites: AutoriteOption[] = [];
  promoteurs: RefOption[] = [];
  typePersonneMoraleOptions: RefOption[] = [];
  promoteurMode: 'existing' | 'new' = 'existing';

  readonly refOptionLabel = refOptionLabel;
  readonly localiteOptionLabel = localiteOptionLabel;
  readonly iepOptionLabel = iepOptionLabel;
  readonly natureOptionLabel = natureOptionLabel;
  readonly periodiciteOptionLabel = periodiciteOptionLabel;
  readonly autoriteOptionLabel = autoriteOptionLabel;

  stepIndex = 0;

  model: SimpleFullCreatePayload = {
    libelle: '',
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
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data as any;
    this.title = this.title ?? data?.title;
    this.apiPath = this.apiPath ?? data?.apiPath;
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      rows: this.http.get<SpringPage<Record<string, unknown>>>(`${this.apiBaseUrl}${this.apiPath}`, {
        params: this.buildSimpleListParams(),
      }),
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
        this.rows = list.map((x) => this.mapRow(x));
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
      return c.localiteId != null && c.iepId != null && c.natureCentreId != null;
    }
    if (this.stepIndex === 2) {
      return String(this.model.libelle ?? '').trim().length > 0;
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
    if (i <= this.stepIndex) {
      this.stepIndex = i;
      return;
    }
    if (i === this.stepIndex + 1 && this.canGoNext()) {
      this.stepIndex = i;
    }
  }

  resetWizard(): void {
    this.stepIndex = 0;
    this.model = {
      libelle: '',
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

  openDetails(row: Row): void {
    this.detailsModalOpen = true;
    this.detailsLoading = true;
    this.detailsRow = null;
    this.errorMessage = null;
    this.http.get<Record<string, unknown>>(`${this.apiBaseUrl}${this.apiPath}/${row.idCentre}`).subscribe({
      next: (x) => {
        this.detailsRow = this.mapCentreDetailFromApi(x);
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

  openEdit(row: Row): void {
    this.editRowId = row.idCentre;
    this.editLoading = true;
    this.errorMessage = null;
    this.http.get<Record<string, unknown>>(`${this.apiBaseUrl}${this.apiPath}/${row.idCentre}`).subscribe({
      next: (x) => {
        const d = this.mapCentreDetailFromApi(x);
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
    this.http.put(`${this.apiBaseUrl}${this.apiPath}/${id}/infos`, this.editForm).subscribe({
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

  deleteRow(row: Row): void {
    if (!confirm('Supprimer cet enregistrement ?')) return;
    this.saving = true;
    this.http.delete(`${this.apiBaseUrl}${this.apiPath}/${row.idCentre}`).subscribe({
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

  submit(): void {
    if (!this.canSubmit()) return;
    this.saving = true;
    this.errorMessage = null;
    const promoteurPayload = this.buildPromoteurPayload();
    const payload: SimpleFullCreatePayload = {
      libelle: String(this.model.libelle ?? '').trim(),
      promoteur: promoteurPayload,
      centre: { ...this.model.centre },
    };
    this.http.post(`${this.apiBaseUrl}${this.apiPath}`, payload).subscribe({
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

  private libelleQueryParam(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cec')) return 'libelleCec';
    if (p.includes('/cp')) return 'libellleCp';
    return 'libelleSie';
  }

  private buildSimpleListParams(): HttpParams {
    let p = new HttpParams()
      .set('page', String(this.pageIndex))
      .set('size', String(this.pageSize))
      .set('sort', 'id,asc');
    const q = String(this.searchQ ?? '').trim();
    if (q !== '') {
      p = p.set('q', q);
    }
    const libKey = this.libelleQueryParam();
    for (const [key, val] of Object.entries(this.simpleListFilter)) {
      const s = String(val ?? '').trim();
      if (s === '') continue;
      const apiKey = key === 'libelle' ? libKey : key;
      p = p.set(apiKey, s);
    }
    return p;
  }

  private mapRow(x: Record<string, unknown>): Row {
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

  private mapCentreDetailFromApi(x: Record<string, unknown>): CentreDetailRow {
    const base = this.mapRow(x);
    return {
      ...base,
      localite: this.asCentreRef(x['localite']),
      iep: this.asCentreRef(x['iep']),
      naturecentre: this.asCentreRef(x['naturecentre']),
      periodicite: this.asCentreRef(x['periodicite']),
      autoriteAutorisation: this.asCentreRef(x['autoriteAutorisation']),
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

  private pickBool(obj: Record<string, unknown>, ...keys: string[]): boolean | null {
    for (const k of keys) {
      const v = obj[k];
      if (v === true || v === false) return v;
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

  promoteurSummary(row: Row): string {
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

  recapWizardExistingPromoteurLabel(): string {
    const id = this.model.promoteur?.id;
    if (id == null) return '—';
    const p = this.promoteurs.find((x) => x.id === id);
    return p ? this.refOptionLabel(p) : `#${id}`;
  }

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
    for (const k of Object.keys(this.simpleListFilter)) {
      this.simpleListFilter[k] = '';
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

