import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AlphaFullCreatePayload,
  AlphaNiveauPayload,
  AlphaRow,
  AutoriteOption,
  autoriteOptionLabel,
  CentreDetailRow,
  CentreNiveauDetails,
  CentreRefDetails,
  DepartementOption,
  IepOption,
  iepOptionLabel,
  LocaliteOption,
  localiteOptionLabel,
  NatureOption,
  natureOptionLabel,
  PeriodiciteOption,
  periodiciteOptionLabel,
  PromoteurOption,
  PromoteurUpsertPayload,
  promoteurDetailsFromApi,
  refOptionLibelle,
  RefOption,
  refOptionLabel,
  SousPrefectureOption,
  SpringPage,
  TypePromoteur,
} from '@models/centre';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { isNationalView } from '@core/circonscription/circonscription.util';
import { AuthSession } from '@core/models/auth.models';
import { AuthService } from '@services/auth.service';
import { MenaRowActionButtonComponent } from '@shared/mena-row-action-button/mena-row-action-button.component';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import { MenaToolbarButtonComponent } from '@shared/mena-toolbar-button/mena-toolbar-button.component';
import { MenaContextDashboardComponent } from '@shared/mena-context-dashboard/mena-context-dashboard.component';
import {
  CentrePageMode,
  centrePageModeFromRoute,
  displayOrDash,
  fetchPromoteurOptionDetails,
  printCentreIdentificationFiche,
  wizardSavedFicheFromCreateResponse,
  WizardSavedFiche,
} from '@features/centres/centre-create-wizard.util';
import {
  menaAutoriteSelectOptions,
  menaIepSelectOptions,
  menaLocaliteSelectOptions,
  menaNatureSelectOptions,
  menaPeriodiciteSelectOptions,
  menaPromoteurSelectOptions,
  menaRefLibelleStringOptions,
  menaRefSelectOptions,
  sortPromoteurOptions,
  sortRefOptions,
} from '@features/centres/centre-select-options.util';
import { sortByLabel } from '@shared/mena-searchable-select/mena-select-options.util';

type DrenaDepartementOption = RefOption & {
  drena?: CentreRefDetails | null;
  departement?: CentreRefDetails | null;
};

@Component({
  selector: 'app-alpha-centres',
  standalone: true,
  imports: [
    MenaLoadingComponent,
    CommonModule,
    FormsModule,
    RouterLink,
    MenaRowActionButtonComponent,
    MenaSearchableSelectComponent,
    MenaToolbarButtonComponent,
    MenaContextDashboardComponent,
  ],
  templateUrl: './alpha-centres.component.html',
})
export class AlphaCentresComponent {
  private static readonly NATIONAL_ROLES = new Set([
    'ADMIN',
    'SUPER_ADMIN',
    'SUPER_ROOT',
    'SUPERVISEUR_AENF',
    'DIRECTEUR',
  ]);
  readonly typePromoteurOptions: TypePromoteur[] = ['PHYSIQUE', 'MORALE'];
  pageTitle = 'Centres Alpha';
  pageSubtitle = '';
  pageMode: CentrePageMode = 'list';
  listPath = '';
  createPath = '';
  createPanelOpen = false;
  canCollapseCreatePanel = true;

  wizardSavedSuccess = false;
  wizardSavedMessage: string | null = null;
  savedFiche: WizardSavedFiche | null = null;
  wizardPromoteurDetails: PromoteurOption | null = null;
  wizardPromoteurLoading = false;
  loading = false;
  saving = false;
  errorMessage: string | null = null;
  private refsLoaded = false;

  /** Listes référentiel des selects (création / wizard) pas encore chargées. */
  get refsSelectLoading(): boolean {
    return !this.refsLoaded;
  }

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
  regions: RefOption[] = [];
  drenas: RefOption[] = [];
  departements: DepartementOption[] = [];
  drenaDepartements: DrenaDepartementOption[] = [];
  communes: RefOption[] = [];
  sousPrefectures: SousPrefectureOption[] = [];
  promoteurs: PromoteurOption[] = [];
  typePersonneMoraleOptions: RefOption[] = [];
  civilites: RefOption[] = [];
  fonctions: RefOption[] = [];
  /** Référentiel `niveau_personnel` (libellé stocké dans promoteur.niveauEtudes). */
  niveauxPersonnel: RefOption[] = [];
  niveauAlphaOptions: RefOption[] = [];
  selectedNiveauAlphaOptionIds: number[] = [];
  editSelectedNiveauAlphaOptionIds: number[] = [];
  promoteurMode: 'existing' | 'new' = 'existing';

  /** Exposés au template pour les libellés des &lt;select&gt; filtres. */
  readonly refOptionLabel = refOptionLabel;
  readonly refOptionLibelle = refOptionLibelle;
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
      nombreVisite: null,
      totalApprenants: null,
      totalHommes: null,
      totalFemmes: null,
      latitudeGps: '',
      longitudeGps: '',
      gpsValide: null,
      structurePartenaire: '',
      nomPartenaire: '',
      localisationCentre: '',
      nomMilieuImplentation: '',
    },
    niveaux: [],
  };

  // Détails / édition (modales)
  detailsModalOpen = false;
  detailsLoading = false;
  detailsRow: CentreDetailRow | null = null;
  editRowId: number | null = null;
  editLoading = false;
  createRegionId: number | null = null;
  createDrenaId: number | null = null;
  createDepartementId: number | null = null;
  createCommuneId: number | null = null;
  editRegionId: number | null = null;
  editDrenaId: number | null = null;
  editDepartementId: number | null = null;
  editCommuneId: number | null = null;
  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  /** Recherche rapide → paramètre API `q` (OR sur plusieurs colonnes + id si entier). */
  searchQ = '';
  /** Filtres liste : circonscription / IEPP (query `idDrena`, `idIep`). */
  listFilterDrenaId: number | null = null;
  listFilterIepId: number | null = null;
  private listGeoInitialized = false;

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
    totalApprenants: '',
    totalHommes: '',
    totalFemmes: '',
    latitudeGps: '',
    longitudeGps: '',
    gpsValide: '',
    structurePartenaire: '',
    nomPartenaire: '',
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
    totalApprenants: number | null;
    totalHommes: number | null;
    totalFemmes: number | null;
    latitudeGps: string | null;
    longitudeGps: string | null;
    gpsValide: boolean | null;
    structurePartenaire: string | null;
    nomPartenaire: string | null;
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
    totalApprenants: null,
    totalHommes: null,
    totalFemmes: null,
    latitudeGps: null,
    longitudeGps: null,
    gpsValide: null,
    structurePartenaire: null,
    nomPartenaire: null,
    localisationCentre: null,
    nomMilieuImplentation: null,
    encadreurNonMena: null,
    encadrerParMena: null,
    idPromoteur: null,
  };

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
    private readonly auth: AuthService,
  ) {
    const data = this.route.snapshot.data as Record<string, unknown>;
    this.pageTitle = (data['title'] as string | undefined) ?? this.pageTitle;
    this.pageSubtitle = (data['subtitle'] as string | undefined) ?? this.pageSubtitle;
    this.pageMode = centrePageModeFromRoute(data);
    this.listPath = (data['listPath'] as string | undefined) ?? '';
    this.createPath = (data['createPath'] as string | undefined) ?? '';
    this.createPanelOpen = this.isCreatePage;
    this.canCollapseCreatePanel = !this.isCreatePage;
    this.loadAll();
  }

  get isCreatePage(): boolean {
    return this.pageMode === 'create';
  }

  get isListPage(): boolean {
    return this.pageMode === 'list';
  }

  get wizardLockedAfterSave(): boolean {
    return this.wizardSavedSuccess;
  }

  openCreatePanel(): void {
    this.createPanelOpen = true;
    this.stepIndex = 0;
  }

  closeCreatePanel(): void {
    if (!this.canCollapseCreatePanel) {
      return;
    }
    this.createPanelOpen = false;
  }

  loadAll(): void {
    if (this.refsLoaded) {
      if (this.isListPage) {
        this.loadRows();
      }
      return;
    }
    this.loadRefsAndRows();
  }

  private loadRows(): void {
    this.loading = true;
    this.errorMessage = null;
    this.http.get<SpringPage<Record<string, unknown>>>(`${this.apiBaseUrl}/api/alpha`, {
      params: this.buildAlphaListParams(),
    }).subscribe({
      next: (page) => {
        this.applyRowsPage(page);
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  private loadRefsAndRows(): void {
    this.loading = true;
    this.errorMessage = null;
    const refRequests = this.alphaWizardRefRequests();
    const onLoaded = (res: Parameters<AlphaCentresComponent['applyReferenceOptions']>[0] & {
      rows?: SpringPage<Record<string, unknown>>;
    }): void => {
      if (res.rows) {
        this.applyRowsPage(res.rows);
      }
      this.applyReferenceOptions(res);
      this.refsLoaded = true;
      this.loading = false;
      if (this.isListPage && !this.listGeoInitialized) {
        this.listGeoInitialized = true;
        if (this.applyListFilterFromSession()) {
          this.pageIndex = 0;
          this.loadRows();
        }
      }
    };
    const onError = (e: unknown): void => {
      this.errorMessage = this.formatError(e);
      this.loading = false;
    };
    if (this.isListPage) {
      forkJoin({
        ...refRequests,
        rows: this.http.get<SpringPage<Record<string, unknown>>>(`${this.apiBaseUrl}/api/alpha`, {
          params: this.buildAlphaListParams(),
        }),
      }).subscribe({ next: onLoaded, error: onError });
      return;
    }
    forkJoin(refRequests).subscribe({ next: onLoaded, error: onError });
  }

  private alphaWizardRefRequests() {
    return {
      campagnes: this.http.get<any[]>(`${this.apiBaseUrl}/api/campagnes`),
      categories: this.http.get<any[]>(`${this.apiBaseUrl}/api/categorie-centre-alpha`),
      typesAlpha: this.http.get<any[]>(`${this.apiBaseUrl}/api/TypeAlphas`),
      regimes: this.http.get<any[]>(`${this.apiBaseUrl}/api/Regimealphabetisations`),
      localites: this.http.get<LocaliteOption[]>(`${this.apiBaseUrl}/api/localite-d-implantation`),
      ieps: this.http.get<IepOption[]>(`${this.apiBaseUrl}/api/iep`),
      regions: this.http.get<any[]>(`${this.apiBaseUrl}/api/region`),
      drenas: this.http.get<any[]>(`${this.apiBaseUrl}/api/drena`),
      departements: this.http.get<any[]>(`${this.apiBaseUrl}/api/departement`),
      drenaDepartements: this.http.get<any[]>(`${this.apiBaseUrl}/api/drena-departement`),
      communes: this.http.get<any[]>(`${this.apiBaseUrl}/api/commune`),
      sousPrefectures: this.http.get<any[]>(`${this.apiBaseUrl}/api/sous-prefecture`),
      natures: this.http.get<NatureOption[]>(`${this.apiBaseUrl}/api/naturecentre`),
      periodicites: this.http.get<PeriodiciteOption[]>(`${this.apiBaseUrl}/api/Periodicites`),
      autorites: this.http.get<AutoriteOption[]>(`${this.apiBaseUrl}/api/autoriteautorisation`),
      promoteurs: this.http.get<any[]>(`${this.apiBaseUrl}/api/promoteur`),
      typePersonneMorales: this.http.get<any[]>(`${this.apiBaseUrl}/api/type-personne-morale`),
      civilites: this.http.get<any[]>(`${this.apiBaseUrl}/api/civilite`),
      fonctions: this.http.get<any[]>(`${this.apiBaseUrl}/api/fonctions`),
      niveauxPersonnel: this.http.get<any[]>(`${this.apiBaseUrl}/api/niveau-personnel`),
      niveauxAlpha: this.http.get<any[]>(`${this.apiBaseUrl}/api/niveaualpha`),
    };
  }

  private applyRowsPage(page: SpringPage<Record<string, unknown>>): void {
    const list = page.content ?? [];
    this.totalElements = page.totalElements ?? 0;
    this.totalPages = page.totalPages ?? 0;
    this.rows = list.map((x) => this.mapAlphaRow(x));
  }

  private applyReferenceOptions(res: {
    campagnes?: any[];
    categories?: any[];
    typesAlpha?: any[];
    regimes?: any[];
    localites?: LocaliteOption[];
    ieps?: IepOption[];
    regions?: any[];
    drenas?: any[];
    departements?: any[];
    drenaDepartements?: any[];
    communes?: any[];
    sousPrefectures?: any[];
    natures?: NatureOption[];
    periodicites?: PeriodiciteOption[];
    autorites?: AutoriteOption[];
    promoteurs?: any[];
    typePersonneMorales?: any[];
    civilites?: any[];
    fonctions?: any[];
    niveauxPersonnel?: any[];
    niveauxAlpha?: any[];
  }): void {
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
      code: x.codeTypeAlpha ?? x.code ?? undefined,
      libelle: x.libelleTypeAlpha ?? x.libelle ?? undefined,
    }));
    this.regimes = (res.regimes ?? []).map((x: any) => ({
      id: x.id,
      code: x.codeRegimeAlpha ?? x.code ?? undefined,
      libelle: x.libelleRegimeAlpha ?? x.libelle ?? undefined,
    }));
    this.localites = res.localites ?? [];
    this.ieps = res.ieps ?? [];
    this.regions = (res.regions ?? []).map((x: any) => this.refOptionFromApi(x));
    this.drenas = (res.drenas ?? []).map((x: any) => this.refOptionFromApi(x));
    this.departements = (res.departements ?? []).map((x: any) => ({
      ...this.refOptionFromApi(x),
      region: this.asCentreRef(x.region),
    }));
    this.drenaDepartements = (res.drenaDepartements ?? []).map((x: any) => ({
      ...this.refOptionFromApi(x),
      drena: this.asCentreRef(x.drena),
      departement: this.asCentreRef(x.departement),
    }));
    this.communes = (res.communes ?? []).map((x: any) => this.refOptionFromApi(x));
    this.sousPrefectures = (res.sousPrefectures ?? []).map((x: any) => ({
      ...this.refOptionFromApi(x),
      departement: this.asCentreRef(x.departement),
    }));
    this.natures = res.natures ?? [];
    this.periodicites = res.periodicites ?? [];
    this.autorites = res.autorites ?? [];
    this.promoteurs = (res.promoteurs ?? []).map((x: any) => ({
      id: x.id,
      code: x.codePromoteur ?? undefined,
      libelle: x.libellePromoteur ?? undefined,
      details: promoteurDetailsFromApi(x),
    }));
    this.typePersonneMoraleOptions = (res.typePersonneMorales ?? []).map((x: any) => ({
      id: x.id,
      code: undefined,
      libelle: x.libelle ?? undefined,
    }));
    this.civilites = (res.civilites ?? []).map((x: any) => this.refOptionFromApi(x));
    this.fonctions = (res.fonctions ?? []).map((x: any) => this.refOptionFromApi(x));
    this.niveauxPersonnel = (res.niveauxPersonnel ?? []).map((x: any) => this.refOptionFromApi(x));
    this.niveauAlphaOptions = this.uniqueRefOptions(
      (res.niveauxAlpha ?? []).map((x: any) => ({
        id: x.id,
        code: x.codeNiveauAlpha ?? x.code ?? undefined,
        libelle: x.libelleNiveauAlpha ?? x.libelleNiveau ?? x.libelle ?? undefined,
      })),
    );
    this.sortWizardReferenceLists();
    this.applySessionGeographyAnchors();
  }

  private sortWizardReferenceLists(): void {
    this.campagnes = sortRefOptions(this.campagnes);
    this.categories = sortRefOptions(this.categories);
    this.typesAlpha = sortRefOptions(this.typesAlpha);
    this.regimes = sortRefOptions(this.regimes);
    this.regions = sortRefOptions(this.regions);
    this.drenas = sortRefOptions(this.drenas);
    this.departements = sortByLabel(this.departements, (d) => this.refOptionLibelle(d));
    this.communes = sortRefOptions(this.communes);
    this.localites = sortByLabel(this.localites, localiteOptionLabel);
    this.ieps = sortByLabel(this.ieps, iepOptionLabel);
    this.natures = sortByLabel(this.natures, natureOptionLabel);
    this.periodicites = sortByLabel(this.periodicites, periodiciteOptionLabel);
    this.autorites = sortByLabel(this.autorites, autoriteOptionLabel);
    this.promoteurs = sortPromoteurOptions(this.promoteurs);
    this.typePersonneMoraleOptions = sortRefOptions(this.typePersonneMoraleOptions);
    this.civilites = sortRefOptions(this.civilites);
    this.fonctions = sortRefOptions(this.fonctions);
    this.niveauxPersonnel = sortRefOptions(this.niveauxPersonnel);
    this.niveauAlphaOptions = sortRefOptions(this.niveauAlphaOptions);
  }

  menaRefOptions(items: RefOption[]) {
    return menaRefSelectOptions(items);
  }

  menaPromoteurOptions() {
    return menaPromoteurSelectOptions(this.promoteurs);
  }

  menaLocaliteOptions(items: LocaliteOption[]) {
    return menaLocaliteSelectOptions(items);
  }

  menaIepOptions(items: IepOption[]) {
    return menaIepSelectOptions(items);
  }

  menaNatureOptions() {
    return menaNatureSelectOptions(this.natures);
  }

  menaAutoriteOptions() {
    return menaAutoriteSelectOptions(this.autorites);
  }

  menaPeriodiciteOptions() {
    return menaPeriodiciteSelectOptions(this.periodicites);
  }

  menaCampagneOptions() {
    return menaRefSelectOptions(this.campagnes);
  }

  menaCategorieOptions() {
    return menaRefSelectOptions(this.categories);
  }

  menaTypeAlphaOptions() {
    return menaRefSelectOptions(this.typesAlpha);
  }

  menaRegimeOptions() {
    return menaRefSelectOptions(this.regimes);
  }

  menaNiveauAlphaOptions() {
    return menaRefSelectOptions(this.niveauAlphaOptions);
  }

  menaTypePersonneMoraleOptions() {
    return menaRefSelectOptions(this.typePersonneMoraleOptions);
  }

  private isNationalScope(s: AuthSession | null): boolean {
    return isNationalView(s);
  }

  private applySessionGeographyAnchors(): void {
    const s = this.auth.currentSession;
    if (!s || this.isNationalScope(s)) return;
    if (s.idIep != null) {
      this.model.centre.iepId = s.idIep;
      const iep = this.ieps.find((i) => i.id === s.idIep);
      if (iep?.drena?.id != null) {
        this.createDrenaId = iep.drena.id;
      }
    }
    if (s.idDrena != null && s.idIep == null) {
      this.createDrenaId = s.idDrena;
    }
    if (s.idLocalite != null) {
      this.model.centre.localiteId = s.idLocalite;
      const loc = this.localites.find((l) => l.id === s.idLocalite);
      if (loc) {
        this.createCommuneId = loc.commune?.id ?? null;
        this.createDepartementId = this.localiteDepartementId(loc);
        this.createRegionId =
          this.createDepartementId != null ? this.departementRegionId(this.createDepartementId) : null;
        if (this.createDrenaId == null && s.idDrena != null) {
          this.createDrenaId = s.idDrena;
        }
      }
    }
    if (s.idRegion != null && s.idIep == null && s.idDrena == null && s.idLocalite == null) {
      this.createRegionId = s.idRegion;
    }
  }

  lockSessionGeoRegion(): boolean {
    const s = this.auth.currentSession;
    if (!s || this.isNationalScope(s)) return false;
    if (s.idLocalite != null || s.idIep != null) return true;
    return s.idRegion != null && s.idDrena == null && s.idIep == null;
  }

  lockSessionGeoDrena(): boolean {
    const s = this.auth.currentSession;
    if (!s || this.isNationalScope(s)) return false;
    return s.idDrena != null || s.idIep != null || s.idLocalite != null;
  }

  lockSessionGeoDepartement(): boolean {
    const s = this.auth.currentSession;
    if (!s || this.isNationalScope(s)) return false;
    return s.idLocalite != null;
  }

  lockSessionGeoCommune(): boolean {
    return this.lockSessionGeoDepartement();
  }

  lockSessionGeoIep(): boolean {
    const s = this.auth.currentSession;
    if (!s || this.isNationalScope(s)) return false;
    return s.idIep != null;
  }

  lockSessionGeoLocalite(): boolean {
    const s = this.auth.currentSession;
    if (!s || this.isNationalScope(s)) return false;
    return s.idLocalite != null;
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
    return !this.saving && this.stepIndex === 3 && !this.wizardSavedSuccess;
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
    if (this.saving || this.wizardLockedAfterSave) return;
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
    return found ? this.localiteOptionLabel(found) : '—';
  }

  iepLabel(id: number | null | undefined): string {
    const found = this.ieps.find((x) => x.id === id);
    return found ? this.iepOptionLabel(found) : '—';
  }

  natureLabel(id: number | null | undefined): string {
    const found = this.natures.find((x) => x.id === id);
    return found ? this.natureOptionLabel(found) : '—';
  }

  periodiciteLabel(id: number | null | undefined): string {
    const found = this.periodicites.find((x) => x.id === id);
    return found ? this.periodiciteOptionLabel(found) : '—';
  }

  autoriteLabel(id: number | null | undefined): string {
    const found = this.autorites.find((x) => x.id === id);
    return found ? this.autoriteOptionLabel(found) : '—';
  }

  drenaLabel(id: number | null | undefined): string {
    const found = this.drenas.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  regionLabel(id: number | null | undefined): string {
    const found = this.regions.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  departementLabel(id: number | null | undefined): string {
    const found = this.departements.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  communeLabel(id: number | null | undefined): string {
    const found = this.communes.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  filteredCreateIeps(): IepOption[] {
    if (this.createDrenaId == null) {
      return this.filterIepsByRegion(this.createRegionId);
    }
    return this.ieps.filter((iep) => iep.drena?.id === this.createDrenaId);
  }

  filteredCreateDrenas(): RefOption[] {
    return this.filterDrenasByRegion(this.createRegionId);
  }

  filteredCreateDepartements(): DepartementOption[] {
    return this.filterDepartements(this.createRegionId, this.createDrenaId);
  }

  filteredCreateCommunes(): RefOption[] {
    return this.filterCommunes(this.createRegionId, this.createDrenaId, this.createDepartementId);
  }

  filteredCreateLocalites(): LocaliteOption[] {
    return this.filterLocalites(
      this.createRegionId,
      this.createDrenaId,
      this.createDepartementId,
      this.createCommuneId,
    );
  }

  filteredEditIeps(): IepOption[] {
    if (this.editDrenaId == null) {
      return this.filterIepsByRegion(this.editRegionId);
    }
    return this.ieps.filter((iep) => iep.drena?.id === this.editDrenaId);
  }

  filteredEditDrenas(): RefOption[] {
    return this.filterDrenasByRegion(this.editRegionId);
  }

  filteredEditDepartements(): DepartementOption[] {
    return this.filterDepartements(this.editRegionId, this.editDrenaId);
  }

  filteredEditCommunes(): RefOption[] {
    return this.filterCommunes(this.editRegionId, this.editDrenaId, this.editDepartementId);
  }

  filteredEditLocalites(): LocaliteOption[] {
    return this.filterLocalites(
      this.editRegionId,
      this.editDrenaId,
      this.editDepartementId,
      this.editCommuneId,
    );
  }

  onCreateRegionChange(): void {
    if (this.createDrenaId != null && !this.filteredCreateDrenas().some((drena) => drena.id === this.createDrenaId)) {
      this.createDrenaId = null;
    }
    if (this.model.centre.iepId != null && !this.filteredCreateIeps().some((iep) => iep.id === this.model.centre.iepId)) {
      this.model.centre.iepId = null as any;
    }
    this.clearCreateChildrenFrom('region');
  }

  onCreateDrenaChange(): void {
    if (this.model.centre.iepId != null && !this.filteredCreateIeps().some((iep) => iep.id === this.model.centre.iepId)) {
      this.model.centre.iepId = null as any;
    }
    this.clearCreateChildrenFrom('drena');
  }

  onCreateIepChange(): void {
    const iep = this.ieps.find((item) => item.id === this.model.centre.iepId);
    this.createDrenaId = iep?.drena?.id ?? this.createDrenaId;
  }

  onCreateDepartementChange(): void {
    this.clearCreateChildrenFrom('departement');
  }

  onCreateCommuneChange(): void {
    if (this.model.centre.localiteId != null && !this.filteredCreateLocalites().some((localite) => localite.id === this.model.centre.localiteId)) {
      this.model.centre.localiteId = null as any;
    }
  }

  onCreateLocaliteChange(): void {
    const localite = this.localites.find((item) => item.id === this.model.centre.localiteId);
    this.createCommuneId = localite?.commune?.id ?? this.createCommuneId;
    this.createDepartementId = localite ? this.localiteDepartementId(localite) : this.createDepartementId;
    this.createRegionId = this.createDepartementId != null ? this.departementRegionId(this.createDepartementId) : this.createRegionId;
  }

  onEditRegionChange(): void {
    if (this.editDrenaId != null && !this.filteredEditDrenas().some((drena) => drena.id === this.editDrenaId)) {
      this.editDrenaId = null;
    }
    if (this.editForm.idIep != null && !this.filteredEditIeps().some((iep) => iep.id === this.editForm.idIep)) {
      this.editForm.idIep = null;
    }
    this.clearEditChildrenFrom('region');
  }

  onEditDrenaChange(): void {
    if (this.editForm.idIep != null && !this.filteredEditIeps().some((iep) => iep.id === this.editForm.idIep)) {
      this.editForm.idIep = null;
    }
    this.clearEditChildrenFrom('drena');
  }

  onEditIepChange(): void {
    const iep = this.ieps.find((item) => item.id === this.editForm.idIep);
    this.editDrenaId = iep?.drena?.id ?? null;
  }

  onEditDepartementChange(): void {
    this.editRegionId = this.editDepartementId != null ? this.departementRegionId(this.editDepartementId) : this.editRegionId;
    this.clearEditChildrenFrom('departement');
  }

  onEditCommuneChange(): void {
    if (this.editForm.idLocalite != null && !this.filteredEditLocalites().some((localite) => localite.id === this.editForm.idLocalite)) {
      this.editForm.idLocalite = null;
    }
  }

  onEditLocaliteChange(): void {
    const localite = this.localites.find((item) => item.id === this.editForm.idLocalite);
    this.editCommuneId = localite?.commune?.id ?? null;
    this.editDepartementId = localite ? this.localiteDepartementId(localite) : null;
    this.editRegionId = this.editDepartementId != null ? this.departementRegionId(this.editDepartementId) : null;
  }

  campagneLabel(id: number | null | undefined): string {
    const found = this.campagnes.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  categorieLabel(id: number | null | undefined): string {
    const found = this.categories.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  typeAlphaLabel(id: number | null | undefined): string {
    const found = this.typesAlpha.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  regimeLabel(id: number | null | undefined): string {
    const found = this.regimes.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  isAlphaNiveauSelected(id: number): boolean {
    return this.selectedNiveauAlphaOptionIds.includes(id);
  }

  toggleAlphaNiveau(option: RefOption, checked: boolean): void {
    if (checked) {
      if (!this.selectedNiveauAlphaOptionIds.includes(option.id)) {
        this.selectedNiveauAlphaOptionIds = [...this.selectedNiveauAlphaOptionIds, option.id];
      }
    } else {
      this.selectedNiveauAlphaOptionIds = this.selectedNiveauAlphaOptionIds.filter((id) => id !== option.id);
    }
    this.model.niveaux = this.selectedNiveauAlphaOptions().map((selected) => ({
      niveauAlphaId: selected.id,
      codeNiveauAlpha: selected.code ?? null,
      libelleNiveauAlpha: selected.libelle ?? this.refOptionLibelle(selected),
    }));
  }

  selectedNiveauAlphaOptions(): RefOption[] {
    return this.alphaNiveauOptionsForIds(this.selectedNiveauAlphaOptionIds);
  }

  editSelectedNiveauAlphaOptions(): RefOption[] {
    return this.alphaNiveauOptionsForIds(this.editSelectedNiveauAlphaOptionIds);
  }

  isEditAlphaNiveauSelected(id: number): boolean {
    return this.editSelectedNiveauAlphaOptionIds.includes(id);
  }

  toggleEditAlphaNiveau(option: RefOption, checked: boolean): void {
    if (checked) {
      if (!this.editSelectedNiveauAlphaOptionIds.includes(option.id)) {
        this.editSelectedNiveauAlphaOptionIds = [...this.editSelectedNiveauAlphaOptionIds, option.id];
      }
      return;
    }
    this.editSelectedNiveauAlphaOptionIds = this.editSelectedNiveauAlphaOptionIds.filter((id) => id !== option.id);
  }

  private alphaNiveauOptionsForIds(ids: number[]): RefOption[] {
    return ids
      .map((id) => this.niveauAlphaOptions.find((option) => option.id === id))
      .filter((option): option is RefOption => option != null);
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.syncWizardTotalApprenants();
    this.sanitizeWizardNonNegativeNumbers();
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
      niveaux: this.buildAlphaNiveauxPayload(),
    };

    this.http.post<Record<string, unknown>>(`${this.apiBaseUrl}/api/alpha`, payload).subscribe({
      next: (body) => {
        this.saving = false;
        this.savedFiche = wizardSavedFicheFromCreateResponse(body);
        this.wizardSavedSuccess = true;
        const code = this.savedFiche.codeCentre ?? '—';
        this.wizardSavedMessage = `Centre Alpha enregistré avec succès. Code centre : ${code}.`;
        this.stepIndex = 3;
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
          totalApprenants: d.totalApprenants ?? null,
          totalHommes: d.totalHommes ?? null,
          totalFemmes: d.totalFemmes ?? null,
          latitudeGps: d.latitudeGps ?? null,
          longitudeGps: d.longitudeGps ?? null,
          gpsValide: d.gpsValide ?? null,
          structurePartenaire: d.structurePartenaire ?? null,
          nomPartenaire: d.nomPartenaire ?? null,
          localisationCentre: d.localisationCentre ?? null,
          nomMilieuImplentation: d.nomMilieuImplentation ?? null,
          encadreurNonMena: d.encadreurNonMena ?? null,
          encadrerParMena: d.encadrerParMena ?? null,
          idPromoteur: d.promoteur?.idPromoteur ?? d.idPromoteur ?? null,
        };
        this.syncEditTotalApprenants();
        this.editRegionId = d.region?.id ?? null;
        this.editDrenaId = d.drena?.id ?? this.ieps.find((iep) => iep.id === d.idIep)?.drena?.id ?? null;
        const selectedLocalite = this.localites.find((localite) => localite.id === d.idLocalite);
        this.editCommuneId = d.commune?.id ?? selectedLocalite?.commune?.id ?? null;
        this.editDepartementId = d.departement?.id ?? (selectedLocalite ? this.localiteDepartementId(selectedLocalite) : null);
        this.editRegionId = this.editRegionId ?? (this.editDepartementId != null ? this.departementRegionId(this.editDepartementId) : null);
        this.editSelectedNiveauAlphaOptionIds = this.alphaNiveauOptionIdsFromDetails(d.niveaux ?? []);
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
    this.editSelectedNiveauAlphaOptionIds = [];
    this.editRegionId = null;
    this.editDrenaId = null;
    this.editDepartementId = null;
    this.editCommuneId = null;
  }

  canSaveEdit(): boolean {
    return !this.saving && !this.editLoading && this.editRowId != null && this.editForm.libelle.trim().length > 0;
  }

  saveEdit(): void {
    if (!this.canSaveEdit()) return;
    this.syncEditTotalApprenants();
    this.sanitizeEditNonNegativeNumbers();
    const id = this.editRowId!;
    this.saving = true;
    const payload = {
      ...this.editForm,
      niveauxAlpha: this.buildAlphaNiveauxPayloadFromIds(this.editSelectedNiveauAlphaOptionIds),
    };
    this.http.put(`${this.apiBaseUrl}/api/alpha/${id}/infos`, payload).subscribe({
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
    this.clearWizardSaveState();
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
        nombreVisite: null,
        totalApprenants: null,
        totalHommes: null,
        totalFemmes: null,
        latitudeGps: '',
        longitudeGps: '',
        gpsValide: null,
        structurePartenaire: '',
        nomPartenaire: '',
        localisationCentre: '',
        nomMilieuImplentation: '',
      },
      niveaux: [],
    };
    this.selectedNiveauAlphaOptionIds = [];
    this.createRegionId = null;
    this.createDrenaId = null;
    this.createDepartementId = null;
    this.createCommuneId = null;
    this.promoteurMode = 'existing';
    this.wizardPromoteurDetails = null;
    this.applySessionGeographyAnchors();
  }

  onPromoteurModeChange(): void {
    this.wizardPromoteurDetails = null;
    if (this.promoteurMode === 'existing') {
      this.model.promoteur = { id: null, typePromoteur: null, libellePromoteur: '', personnePhysique: null, personneMorale: null };
      return;
    }
    this.model.promoteur = {
      id: null,
      typePromoteur: 'PHYSIQUE',
      libellePromoteur: '',
      personnePhysique: {
        nom: '',
        prenom: '',
        contact: '',
        fonction: '',
        sexe: '',
        dateNaissance: '',
        anciennete: '',
        boitePostale: '',
        niveauEtudes: '',
        civilite: '',
      },
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
      nom: '',
      prenom: '',
      contact: '',
      fonction: '',
      sexe: '',
      dateNaissance: '',
      anciennete: '',
      boitePostale: '',
      niveauEtudes: '',
      civilite: '',
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
    if (this.listFilterIepId != null) {
      p = p.set('idIep', String(this.listFilterIepId));
    } else if (this.listFilterDrenaId != null) {
      p = p.set('idDrena', String(this.listFilterDrenaId));
    }
    for (const [key, val] of Object.entries(this.alphaListFilter)) {
      const s = String(val ?? '').trim();
      if (s !== '' && key !== 'idIep') {
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
      totalApprenants: (x['totalApprenants'] as number | null | undefined) ?? null,
      totalHommes: (x['totalHommes'] as number | null | undefined) ?? null,
      totalFemmes: (x['totalFemmes'] as number | null | undefined) ?? null,
      latitudeGps: (x['latitudeGps'] as string | undefined) ?? null,
      longitudeGps: (x['longitudeGps'] as string | undefined) ?? null,
      gpsValide: this.pickBool(x, 'gpsValide'),
      structurePartenaire: (x['structurePartenaire'] as string | undefined) ?? null,
      nomPartenaire: (x['nomPartenaire'] as string | undefined) ?? null,
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
      drena: this.asCentreRef(x['drena']),
      commune: this.asCentreRef(x['commune']),
      sousPrefecture: this.asCentreRef(x['sousPrefecture']),
      departement: this.asCentreRef(x['departement']),
      region: this.asCentreRef(x['region']),
      naturecentre: this.asCentreRef(x['naturecentre']),
      periodicite: this.asCentreRef(x['periodicite']),
      autoriteAutorisation: this.asCentreRef(x['autoriteAutorisation']),
      campagne: this.asCentreRef(x['campagne']),
      categorieCentreAlpha: this.asCentreRef(x['categorieCentreAlpha']),
      typeAlpha: this.asCentreRef(x['typeAlpha']),
      regimeAlpha: this.asCentreRef(x['regimeAlpha']),
      niveaux: this.asNiveauDetailsArray(x['niveaux']),
    };
  }

  refCentreLabel(ref: CentreRefDetails | null | undefined, fallback: () => string): string {
    if (!ref) return fallback();
    const l = ref.libelle?.trim();
    if (l) return l;
    const c = ref.code?.trim();
    if (c) return c;
    return fallback();
  }

  detailLocaliteLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.localite, () => this.localiteLabel(d.idLocalite ?? null));
  }

  detailIepLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.iep, () => this.iepLabel(d.idIep ?? null));
  }

  detailDrenaLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.drena, () => {
      const iep = this.ieps.find((x) => x.id === d.idIep);
      return this.drenaLabel(iep?.drena?.id ?? null);
    });
  }

  detailCommuneLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.commune, () => {
      const localite = this.localites.find((x) => x.id === d.idLocalite);
      return this.communeLabel(localite?.commune?.id ?? null);
    });
  }

  detailSousPrefectureLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.sousPrefecture, () => {
      const localite = this.localites.find((x) => x.id === d.idLocalite);
      return localite?.sousPrefecture ? this.refOptionLibelle(localite.sousPrefecture as RefOption) : '—';
    });
  }

  detailDepartementLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.departement, () => {
      const localite = this.localites.find((x) => x.id === d.idLocalite);
      return this.departementLabel(localite ? this.localiteDepartementId(localite) : null);
    });
  }

  detailRegionLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.region, () => '—');
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

  private refOptionFromApi(value: Record<string, unknown>): RefOption {
    return {
      id: Number(value['id'] ?? 0),
      code: (
        value['code'] ??
        value['codeDrena'] ??
        value['codeDepartement'] ??
        value['codeCommune'] ??
        value['codeSousPrefecture'] ??
        undefined
      ) as string | undefined,
      libelle: (
        value['libelle'] ??
        value['libelleCivilite'] ??
        value['libelleFonction'] ??
        value['libelleNiveauEtude'] ??
        value['nomDrena'] ??
        value['nomDepartement'] ??
        value['nomCommune'] ??
        value['nomSousPrefecture'] ??
        undefined
      ) as string | undefined,
    };
  }

  private localiteDepartementId(localite: LocaliteOption): number | null {
    const sousPrefectureId = localite.sousPrefecture?.id;
    if (sousPrefectureId == null) return null;
    const sousPrefecture = this.sousPrefectures.find((item) => item.id === sousPrefectureId);
    return sousPrefecture?.departement?.id ?? null;
  }

  private departementRegionId(departementId: number | null): number | null {
    if (departementId == null) return null;
    return this.departements.find((item) => item.id === departementId)?.region?.id ?? null;
  }

  private filterDepartements(regionId: number | null, drenaId: number | null): DepartementOption[] {
    const allowedIds = this.allowedDepartementIds(regionId, drenaId);
    if (allowedIds == null) return this.departements;
    return this.departements.filter((departement) => allowedIds.has(departement.id));
  }

  private filterDrenasByRegion(regionId: number | null): RefOption[] {
    const allowedIds = this.allowedDrenaIds(regionId);
    if (allowedIds == null) return this.drenas;
    return this.drenas.filter((drena) => allowedIds.has(drena.id));
  }

  private filterIepsByRegion(regionId: number | null): IepOption[] {
    const allowedDrenaIds = this.allowedDrenaIds(regionId);
    if (allowedDrenaIds == null) return this.ieps;
    return this.ieps.filter((iep) => iep.drena?.id != null && allowedDrenaIds.has(iep.drena.id));
  }

  private filterCommunes(
    regionId: number | null,
    drenaId: number | null,
    departementId: number | null,
  ): RefOption[] {
    if (regionId == null && drenaId == null && departementId == null) return this.communes;
    const communeIds = new Set(
      this.filterLocalites(regionId, drenaId, departementId, null)
        .map((localite) => localite.commune?.id)
        .filter((id): id is number => id != null),
    );
    return this.communes.filter((commune) => communeIds.has(commune.id));
  }

  private filterLocalites(
    regionId: number | null,
    drenaId: number | null,
    departementId: number | null,
    communeId: number | null,
  ): LocaliteOption[] {
    const allowedDepartementIds = this.allowedDepartementIds(regionId, drenaId);
    return this.localites.filter((localite) => {
      const localiteDepartementId = this.localiteDepartementId(localite);
      const matchesDepartement = departementId == null || localiteDepartementId === departementId;
      const matchesAllowedDepartements =
        allowedDepartementIds == null ||
        (localiteDepartementId != null && allowedDepartementIds.has(localiteDepartementId));
      const matchesCommune = communeId == null || localite.commune?.id === communeId;
      return matchesDepartement && matchesAllowedDepartements && matchesCommune;
    });
  }

  private allowedDepartementIds(regionId: number | null, drenaId: number | null): Set<number> | null {
    const sets: Array<Set<number>> = [];
    if (regionId != null) {
      sets.push(new Set(this.departements.filter((d) => d.region?.id === regionId).map((d) => d.id)));
    }
    if (drenaId != null) {
      sets.push(
        new Set(
          this.drenaDepartements
            .filter((item) => item.drena?.id === drenaId)
            .map((item) => item.departement?.id)
            .filter((id): id is number => id != null),
        ),
      );
    }
    if (sets.length === 0) return null;
    return sets.reduce((acc, set) => new Set([...acc].filter((id) => set.has(id))));
  }

  private allowedDrenaIds(regionId: number | null): Set<number> | null {
    if (regionId == null) return null;
    const regionDepartementIds = new Set(
      this.departements
        .filter((departement) => departement.region?.id === regionId)
        .map((departement) => departement.id),
    );
    return new Set(
      this.drenaDepartements
        .filter((item) => item.departement?.id != null && regionDepartementIds.has(item.departement.id))
        .map((item) => item.drena?.id)
        .filter((id): id is number => id != null),
    );
  }

  private clearCreateChildrenFrom(parent: 'region' | 'drena' | 'departement'): void {
    if (this.createDepartementId != null && !this.filteredCreateDepartements().some((d) => d.id === this.createDepartementId)) {
      this.createDepartementId = null;
    }
    if (this.createCommuneId != null && !this.filteredCreateCommunes().some((c) => c.id === this.createCommuneId)) {
      this.createCommuneId = null;
    }
    if (this.model.centre.localiteId != null && !this.filteredCreateLocalites().some((l) => l.id === this.model.centre.localiteId)) {
      this.model.centre.localiteId = null as any;
    }
    if (parent === 'region' || parent === 'departement') {
      return;
    }
  }

  private clearEditChildrenFrom(parent: 'region' | 'drena' | 'departement'): void {
    if (this.editDepartementId != null && !this.filteredEditDepartements().some((d) => d.id === this.editDepartementId)) {
      this.editDepartementId = null;
    }
    if (this.editCommuneId != null && !this.filteredEditCommunes().some((c) => c.id === this.editCommuneId)) {
      this.editCommuneId = null;
    }
    if (this.editForm.idLocalite != null && !this.filteredEditLocalites().some((l) => l.id === this.editForm.idLocalite)) {
      this.editForm.idLocalite = null;
    }
    if (parent === 'region' || parent === 'departement') {
      return;
    }
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
    return p ? this.refOptionLabel(p) : '—';
  }

  recapWizardExistingPromoteurDetails(): PromoteurOption | null {
    if (this.wizardPromoteurDetails) {
      return this.wizardPromoteurDetails;
    }
    const id = this.model.promoteur?.id;
    if (id == null) return null;
    return this.promoteurs.find((x) => x.id === id) ?? null;
  }

  clearWizardSaveState(): void {
    this.wizardSavedSuccess = false;
    this.wizardSavedMessage = null;
    this.savedFiche = null;
    document.body.classList.remove('mena-print-centre-fiche');
  }

  printWizardFiche(): void {
    if (!this.wizardSavedSuccess) return;
    document.body.classList.add('mena-print-centre-fiche');
    printCentreIdentificationFiche('centre-wizard-fiche-print');
    window.setTimeout(() => document.body.classList.remove('mena-print-centre-fiche'), 500);
  }

  onWizardPromoteurIdChange(id: number | null): void {
    this.model.promoteur.id = id;
    if (this.promoteurMode !== 'existing') return;
    if (id == null) {
      this.wizardPromoteurDetails = null;
      return;
    }
    this.wizardPromoteurLoading = true;
    fetchPromoteurOptionDetails(this.http, this.apiBaseUrl, this.promoteurs, id).subscribe({
      next: (option) => {
        this.wizardPromoteurDetails = option;
        this.wizardPromoteurLoading = false;
      },
      error: () => {
        this.wizardPromoteurDetails = this.promoteurs.find((p) => p.id === id) ?? null;
        this.wizardPromoteurLoading = false;
      },
    });
  }

  wizardRecapCodeCentre(): string {
    if (this.savedFiche?.codeCentre) {
      return this.savedFiche.codeCentre;
    }
    return 'Attribué à l’enregistrement';
  }

  wizardRecapLibelle(): string {
    return this.savedFiche?.libelle?.trim() || String(this.model.libelleAlpha ?? '').trim() || '—';
  }

  /** Libellé du type personne morale sélectionné (récap wizard). */
  recapWizardTypePersonneMoraleLabel(): string {
    const id = this.model.promoteur?.personneMorale?.idTypePersonneMorale;
    if (id == null) return '—';
    const t = this.typePersonneMoraleOptions.find((x) => x.id === id);
    return t ? this.refOptionLabel(t) : '—';
  }

  readonly displayOrDash = displayOrDash;

  menaCiviliteLibelleOptions() {
    return menaRefLibelleStringOptions(this.civilites);
  }

  menaFonctionLibelleOptions() {
    return menaRefLibelleStringOptions(this.fonctions);
  }

  menaNiveauPersonnelLibelleOptions() {
    return menaRefLibelleStringOptions(this.niveauxPersonnel);
  }

  private buildAlphaNiveauxPayload(): AlphaNiveauPayload[] {
    return this.buildAlphaNiveauxPayloadFromIds(this.selectedNiveauAlphaOptionIds);
  }

  private buildAlphaNiveauxPayloadFromIds(ids: number[]): AlphaNiveauPayload[] {
    return this.alphaNiveauOptionsForIds(ids)
      .map((option) => ({
        niveauAlphaId: option.id,
        codeNiveauAlpha: option.code?.trim() || null,
        libelleNiveauAlpha: String(option.libelle ?? this.refOptionLibelle(option)).trim(),
      }));
  }

  private alphaNiveauOptionIdsFromDetails(niveaux: CentreNiveauDetails[]): number[] {
    const ids: number[] = [];
    for (const niveau of niveaux) {
      if (niveau.niveauId != null) {
        const foundById = this.niveauAlphaOptions.find((option) => option.id === niveau.niveauId);
        if (foundById && !ids.includes(foundById.id)) ids.push(foundById.id);
        continue;
      }
      const libelle = String(niveau.libelleNiveau ?? '').trim().toLowerCase();
      const code = String(niveau.codeNiveau ?? '').trim().toLowerCase();
      const found = this.niveauAlphaOptions.find((option) => {
        const optionLibelle = String(option.libelle ?? '').trim().toLowerCase();
        const optionCode = String(option.code ?? '').trim().toLowerCase();
        return (libelle !== '' && optionLibelle === libelle) || (code !== '' && optionCode === code);
      });
      if (found && !ids.includes(found.id)) ids.push(found.id);
    }
    return ids;
  }

  private asNiveauDetailsArray(value: unknown): CentreNiveauDetails[] {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
      .map((item) => ({
        id: this.optionalPositiveInt(item['id']),
        niveauId: this.optionalPositiveInt(item['niveauId']),
        codeNiveau: (item['codeNiveau'] as string | undefined) ?? null,
        libelleNiveau: (item['libelleNiveau'] as string | undefined) ?? null,
        anneeScolaire: this.asCentreRef(item['anneeScolaire']),
        nombreSalle: this.optionalPositiveInt(item['nombreSalle']),
      }));
  }

  private uniqueRefOptions(options: RefOption[]): RefOption[] {
    const seen = new Set<string>();
    const result: RefOption[] = [];
    for (const option of options) {
      const label = option.libelle?.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(option);
    }
    return result;
  }

  private buildPromoteurPayload(): PromoteurUpsertPayload {
    if (this.promoteurMode === 'existing') {
      return { id: this.model.promoteur.id ?? null };
    }
    const rawPp = this.model.promoteur.personnePhysique;
    const personnePhysique =
      this.model.promoteur.typePromoteur === 'PHYSIQUE' && rawPp
        ? {
            libellePersonnePhysique: null,
            nom: this.trimToNull(rawPp.nom),
            prenom: this.trimToNull(rawPp.prenom),
            contact: this.trimToNull(rawPp.contact),
            fonction: this.trimToNull(rawPp.fonction),
            sexe: this.trimToNull(rawPp.sexe),
            dateNaissance: this.trimToNull(rawPp.dateNaissance as string | null | undefined),
            anciennete: this.trimToNull(rawPp.anciennete),
            boitePostale: this.trimToNull(rawPp.boitePostale),
            niveauEtudes: this.trimToNull(rawPp.niveauEtudes),
            civilite: this.trimToNull(rawPp.civilite),
          }
        : null;
    return {
      libellePromoteur: null,
      typePromoteur: this.model.promoteur.typePromoteur ?? null,
      personnePhysique,
      personneMorale: this.model.promoteur.personneMorale ?? null,
    };
  }

  onWizardGenreCountsChange(): void {
    this.syncWizardTotalApprenants();
  }

  onEditGenreCountsChange(): void {
    this.syncEditTotalApprenants();
  }

  private syncWizardTotalApprenants(): void {
    const c = this.model.centre;
    c.totalHommes = this.nonNegativeIntOrNull(c.totalHommes as number | null);
    c.totalFemmes = this.nonNegativeIntOrNull(c.totalFemmes as number | null);
    const h = c.totalHommes;
    const f = c.totalFemmes;
    if (h == null && f == null) {
      c.totalApprenants = null;
    } else {
      c.totalApprenants = (h ?? 0) + (f ?? 0);
    }
  }

  private syncEditTotalApprenants(): void {
    const h = this.nonNegativeIntOrNull(this.editForm.totalHommes);
    const f = this.nonNegativeIntOrNull(this.editForm.totalFemmes);
    this.editForm.totalHommes = h;
    this.editForm.totalFemmes = f;
    if (h == null && f == null) {
      this.editForm.totalApprenants = null;
    } else {
      this.editForm.totalApprenants = (h ?? 0) + (f ?? 0);
    }
  }

  private sanitizeWizardNonNegativeNumbers(): void {
    this.syncWizardTotalApprenants();
    const c = this.model.centre;
    c.nombreVisite = this.nonNegativeIntOrNull(c.nombreVisite as number | null);
  }

  private sanitizeEditNonNegativeNumbers(): void {
    this.syncEditTotalApprenants();
    this.editForm.nombreVisite = this.nonNegativeIntOrNull(this.editForm.nombreVisite);
  }

  private nonNegativeIntOrNull(v: number | string | null | undefined): number | null {
    if (v === '' || v == null) return null;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    const i = Math.trunc(n);
    return i < 0 ? null : i;
  }

  private trimToNull(v: string | null | undefined): string | null {
    const s = String(v ?? '').trim();
    return s === '' ? null : s;
  }

  applyListFilters(): void {
    this.pageIndex = 0;
    this.loadAll();
  }

  resetListFilters(): void {
    this.searchQ = '';
    this.listFilterDrenaId = null;
    this.listFilterIepId = null;
    for (const k of Object.keys(this.alphaListFilter)) {
      this.alphaListFilter[k] = '';
    }
    this.applyListFilterFromSession();
    this.pageIndex = 0;
    this.loadAll();
  }

  filteredListIeps(): IepOption[] {
    if (this.listFilterDrenaId == null) {
      return this.ieps;
    }
    return this.ieps.filter((iep) => iep.drena?.id === this.listFilterDrenaId);
  }

  onListDrenaFilterChange(): void {
    if (
      this.listFilterIepId != null &&
      !this.filteredListIeps().some((iep) => iep.id === this.listFilterIepId)
    ) {
      this.listFilterIepId = null;
    }
    this.applyListFilters();
  }

  onListIepFilterChange(): void {
    if (this.listFilterIepId != null) {
      const iep = this.ieps.find((i) => i.id === this.listFilterIepId);
      if (iep?.drena?.id != null) {
        this.listFilterDrenaId = iep.drena.id;
      }
    }
    this.applyListFilters();
  }

  lockListFilterDrena(): boolean {
    return this.lockSessionGeoDrena();
  }

  lockListFilterIep(): boolean {
    return this.lockSessionGeoIep();
  }

  private applyListFilterFromSession(): boolean {
    const s = this.auth.currentSession;
    if (!s || this.isNationalScope(s)) {
      return false;
    }
    if (s.idIep != null) {
      this.listFilterIepId = s.idIep;
      const iep = this.ieps.find((i) => i.id === s.idIep);
      if (iep?.drena?.id != null) {
        this.listFilterDrenaId = iep.drena.id;
      }
      return true;
    }
    if (s.idDrena != null) {
      this.listFilterDrenaId = s.idDrena;
      return true;
    }
    return false;
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

