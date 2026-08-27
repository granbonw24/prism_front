import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  AutoriteOption,
  autoriteOptionLabel,
  CentreDetailRow,
  CentreNiveauDetails,
  CentreRefDetails,
  CentreRow as Row,
  CentreTypeNiveauPayload,
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
  SimpleCentreFullCreatePayload as SimpleFullCreatePayload,
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
  menaOrganisationFaitiereSelectOptions,
  menaPeriodiciteSelectOptions,
  menaPromoteurSelectOptions,
  menaRefLibelleStringOptions,
  menaRefSelectOptions,
  sortPromoteurOptions,
  sortRefOptions,
} from '@features/centres/centre-select-options.util';
import { sortByLabel } from '@shared/mena-searchable-select/mena-select-options.util';
import { MenaListSearchDebouncer } from '@shared/mena-list-search-debounce';

type DrenaDepartementOption = RefOption & {
  drena?: CentreRefDetails | null;
  departement?: CentreRefDetails | null;
};

@Component({
  selector: 'app-simple-centre-type-page',
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
  templateUrl: './simple-centre-type-page.component.html',
})
export class SimpleCentreTypePageComponent implements OnInit, OnDestroy {
  private static readonly NATIONAL_ROLES = new Set([
    'ADMIN',
    'SUPER_ADMIN',
    'SUPER_ROOT',
    'SUPERVISEUR_AENF',
    'DIRECTEUR',
  ]);
  readonly typePromoteurOptions: TypePromoteur[] = ['PHYSIQUE', 'MORALE'];
  @Input({ required: true }) title!: string;
  @Input({ required: true }) apiPath!: string;

  pageMode: CentrePageMode = 'list';
  pageSubtitle = '';
  createTitle = '';
  listPath = '';
  createPath = '';

  wizardSavedSuccess = false;
  wizardSavedMessage: string | null = null;
  savedFiche: WizardSavedFiche | null = null;
  wizardPromoteurDetails: PromoteurOption | null = null;
  wizardPromoteurLoading = false;

  loading = false;
  saving = false;
  errorMessage: string | null = null;
  gpsHint: string | null = null;

  rows: Row[] = [];
  pageIndex = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  /** Recherche multicritère (paramètre API `q`). */
  searchQ = '';
  /** Filtres liste : circonscription / IEPP (query `idDrena`, `idIep`). */
  listFilterDrenaId: number | null = null;
  listFilterIepId: number | null = null;
  listFilterActif: 'all' | 'yes' | 'no' = 'all';
  private listGeoInitialized = false;
  private readonly listTextSearchDebouncer = new MenaListSearchDebouncer();

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
  milieuxImplantation: RefOption[] = [];
  partenaires: RefOption[] = [];
  regions: RefOption[] = [];
  drenas: RefOption[] = [];
  departements: DepartementOption[] = [];
  drenaDepartements: DrenaDepartementOption[] = [];
  communes: RefOption[] = [];
  sousPrefectures: SousPrefectureOption[] = [];
  promoteurs: PromoteurOption[] = [];
  typePersonneMoraleOptions: RefOption[] = [];
  organisationsFaitieres: RefOption[] = [];
  civilites: RefOption[] = [];
  fonctions: RefOption[] = [];
  /** Référentiel `niveau_personnel` (libellé stocké dans promoteur.niveauEtudes). */
  niveauxPersonnel: RefOption[] = [];
  anneesScolaires: RefOption[] = [];
  /** Année scolaire active (figée à la création des niveaux). */
  activeAnneeScolaireId: number | null = null;
  niveaux: RefOption[] = [];
  typesSie: RefOption[] = [];
  ecolesTutrices: RefOption[] = [];
  promoteurMode: 'existing' | 'new' = 'existing';

  readonly refOptionLabel = refOptionLabel;
  readonly refOptionLibelle = refOptionLibelle;
  readonly localiteOptionLabel = localiteOptionLabel;
  readonly iepOptionLabel = iepOptionLabel;
  readonly natureOptionLabel = natureOptionLabel;
  readonly periodiciteOptionLabel = periodiciteOptionLabel;
  readonly autoriteOptionLabel = autoriteOptionLabel;

  stepIndex = 0;

  model: SimpleFullCreatePayload = {
    libelle: '',
    ecoleTutrice: '',
    anneeCreation: null,
    typeSieId: null,
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
      idMilieuImplentation: null,
      dateCreationDaaje: null,
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
    idMilieuImplentation: number | null;
    encadreurNonMena: string | null;
    encadrerParMena: boolean | null;
    idPromoteur: number | null;
    ecoleTutrice: string | null;
    anneeCreation: number | null;
    typeSieId: number | null;
    actif: boolean | null;
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
    idMilieuImplentation: null,
    encadreurNonMena: null,
    encadrerParMena: null,
    idPromoteur: null,
    ecoleTutrice: null,
    anneeCreation: null,
    typeSieId: null,
    actif: true,
  };
  editNiveaux: CentreTypeNiveauPayload[] = [];

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
    private readonly route: ActivatedRoute,
    private readonly auth: AuthService,
  ) {}

  get isCreatePage(): boolean {
    return this.pageMode === 'create';
  }

  get isListPage(): boolean {
    return this.pageMode === 'list';
  }

  get wizardLockedAfterSave(): boolean {
    return this.wizardSavedSuccess;
  }

  ngOnInit(): void {
    const data = this.route.snapshot.data as Record<string, unknown>;
    this.title = this.title ?? (data['title'] as string | undefined);
    this.apiPath = this.apiPath ?? (data['apiPath'] as string | undefined);
    this.pageMode = centrePageModeFromRoute(data);
    this.pageSubtitle = (data['subtitle'] as string | undefined) ?? '';
    this.createTitle = (data['createTitle'] as string | undefined) ?? `Nouveau centre`;
    this.listPath = (data['listPath'] as string | undefined) ?? '';
    this.createPath = (data['createPath'] as string | undefined) ?? '';
    if (this.isCreatePage) {
      this.loadWizardRefs();
    } else {
      this.loadAll();
    }
  }

  loadAll(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin({
      rows: this.http.get<SpringPage<Record<string, unknown>>>(`${this.apiBaseUrl}${this.apiPath}`, {
        params: this.buildSimpleListParams(),
      }),
      ...this.wizardRefRequests(),
    }).subscribe({
      next: (res) => this.applyWizardRefsAndRows(res),
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  loadWizardRefs(): void {
    this.loading = true;
    this.errorMessage = null;
    forkJoin(this.wizardRefRequests()).subscribe({
      next: (res) => {
        this.applyWizardRefs(res);
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  private wizardRefRequests(): Record<string, ReturnType<HttpClient['get']>> {
    return {
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
      milieuxImplantation: this.http.get<any[]>(`${this.apiBaseUrl}/api/milieu-implantation`),
      partenaires: this.http.get<any[]>(`${this.apiBaseUrl}/api/Partenaires`),
      promoteurs: this.http.get<any[]>(`${this.apiBaseUrl}/api/promoteur`),
      typePersonneMorales: this.http.get<any[]>(`${this.apiBaseUrl}/api/type-personne-morale`),
      organisationsFaitieres: this.http.get<any[]>(`${this.apiBaseUrl}/api/organisation-faitiere`),
      civilites: this.http.get<any[]>(`${this.apiBaseUrl}/api/civilite`),
      fonctions: this.http.get<any[]>(`${this.apiBaseUrl}/api/fonctions`),
      niveauxPersonnel: this.http.get<any[]>(`${this.apiBaseUrl}/api/niveau-personnel`),
      anneesScolaires: this.http.get<any[]>(`${this.apiBaseUrl}/api/anneescolaire`),
      niveaux: this.http.get<any[]>(`${this.apiBaseUrl}${this.niveauApiPath()}`),
      typesSie: this.http.get<any[]>(`${this.apiBaseUrl}/api/TypeSies`),
      ecolesTutrices: this.http.get<any[]>(`${this.apiBaseUrl}/api/ecole-tutrice`),
    };
  }

  private applyWizardRefs(res: Record<string, unknown>): void {
    this.localites = (res['localites'] as LocaliteOption[]) ?? [];
    this.ieps = (res['ieps'] as IepOption[]) ?? [];
    this.regions = ((res['regions'] as any[]) ?? []).map((x: any) => this.refOptionFromApi(x));
    this.drenas = ((res['drenas'] as any[]) ?? []).map((x: any) => this.refOptionFromApi(x));
    this.departements = ((res['departements'] as any[]) ?? []).map((x: any) => ({
      ...this.refOptionFromApi(x),
      region: this.asCentreRef(x.region),
    }));
    this.drenaDepartements = ((res['drenaDepartements'] as any[]) ?? []).map((x: any) => ({
      ...this.refOptionFromApi(x),
      drena: this.asCentreRef(x.drena),
      departement: this.asCentreRef(x.departement),
    }));
    this.communes = ((res['communes'] as any[]) ?? []).map((x: any) => this.refOptionFromApi(x));
    this.sousPrefectures = ((res['sousPrefectures'] as any[]) ?? []).map((x: any) => ({
      ...this.refOptionFromApi(x),
      departement: this.asCentreRef(x.departement),
    }));
    this.natures = (res['natures'] as NatureOption[]) ?? [];
    this.periodicites = (res['periodicites'] as PeriodiciteOption[]) ?? [];
    this.autorites = (res['autorites'] as AutoriteOption[]) ?? [];
    this.milieuxImplantation = ((res['milieuxImplantation'] as any[]) ?? []).map((x: any) => ({
      id: Number(x.id ?? 0),
      code: x.codeMilieuImplentation ?? x.code ?? undefined,
      libelle: x.libelleTypeImplentation ?? x.libelle ?? undefined,
    }));
    this.partenaires = ((res['partenaires'] as any[]) ?? []).map((x: any) => ({
      id: Number(x.id ?? 0),
      code: x.codePartenaire ?? x.code ?? undefined,
      libelle: x.libellePartenaire ?? x.libelle ?? undefined,
    }));
    this.promoteurs = ((res['promoteurs'] as any[]) ?? []).map((x: any) => ({
      id: x.id,
      code: x.codePromoteur ?? undefined,
      libelle: x.libellePromoteur ?? undefined,
      details: promoteurDetailsFromApi(x),
    }));
    this.typePersonneMoraleOptions = ((res['typePersonneMorales'] as any[]) ?? []).map((x: any) => ({
      id: x.id,
      code: undefined,
      libelle: x.libelle ?? undefined,
    }));
    this.organisationsFaitieres = ((res['organisationsFaitieres'] as any[]) ?? []).map((x: any) => ({
      id: x.id,
      code: x.sigleOrganisationFaitiere ?? x.code ?? undefined,
      libelle: x.libelleOrganisationFaitiere ?? x.libelle ?? undefined,
    }));
    this.civilites = ((res['civilites'] as any[]) ?? []).map((x: any) => this.refOptionFromApi(x));
    this.fonctions = ((res['fonctions'] as any[]) ?? []).map((x: any) => this.refOptionFromApi(x));
    this.niveauxPersonnel = ((res['niveauxPersonnel'] as any[]) ?? []).map((x: any) => this.refOptionFromApi(x));
    this.anneesScolaires = ((res['anneesScolaires'] as any[]) ?? []).map((x: any) => ({
      id: x.id,
      code: x.codeAnneeScolaire ?? x.code ?? undefined,
      libelle:
        x.debutAnneeScolaire != null && x.finAnneeScolaire != null
          ? `${x.debutAnneeScolaire} - ${x.finAnneeScolaire}`
          : x.libelle ?? x.libelleAnneeScolaire ?? undefined,
      etatAnneeScolaire: x.etatAnneeScolaire === true || x.etatAnneeScolaire === 'true' || x.etatAnneeScolaire === 1,
    }));
    this.activeAnneeScolaireId = this.resolveActiveAnneeScolaireId();
    this.niveaux = ((res['niveaux'] as any[]) ?? []).map((x: any) => ({
      id: x.id,
      code: x.codeNiveauCp ?? x.codeNiveauSie ?? x.code ?? undefined,
      libelle:
        x.libelleNiveauCp ??
        x.libelleNiveauSie ??
        x.libelleNiveau ??
        x.libelle ??
        undefined,
    }));
    this.typesSie = ((res['typesSie'] as any[]) ?? []).map((x: any) => ({
      id: Number(x.id ?? 0),
      code: x.code ?? undefined,
      libelle: x.libelleTypeSie ?? x.libelle ?? undefined,
    }));
    this.ecolesTutrices = ((res['ecolesTutrices'] as any[]) ?? []).map((x: any) => ({
      id: Number(x.id ?? 0),
      code: x.codeEcoleTutrice ?? x.code ?? undefined,
      libelle: (x.libelleEcoleTutrice ?? x.libelle ?? x.codeEcoleTutrice ?? x.code ?? '').toString().trim() || undefined,
    }));
    this.sortWizardReferenceLists();
    this.applySessionGeographyAnchors();
  }

  private sortWizardReferenceLists(): void {
    this.regions = sortRefOptions(this.regions);
    this.drenas = sortRefOptions(this.drenas);
    this.departements = sortByLabel(this.departements, (d) => this.refOptionLibelle(d));
    this.communes = sortRefOptions(this.communes);
    this.localites = sortByLabel(this.localites, localiteOptionLabel);
    this.ieps = sortByLabel(this.ieps, iepOptionLabel);
    this.natures = sortByLabel(this.natures, natureOptionLabel);
    this.periodicites = sortByLabel(this.periodicites, periodiciteOptionLabel);
    this.autorites = sortByLabel(this.autorites, autoriteOptionLabel);
    this.milieuxImplantation = sortRefOptions(this.milieuxImplantation);
    this.partenaires = sortRefOptions(this.partenaires);
    this.promoteurs = sortPromoteurOptions(this.promoteurs);
    this.typePersonneMoraleOptions = sortRefOptions(this.typePersonneMoraleOptions);
    this.organisationsFaitieres = sortRefOptions(this.organisationsFaitieres, true);
    this.civilites = sortRefOptions(this.civilites);
    this.fonctions = sortRefOptions(this.fonctions);
    this.niveauxPersonnel = sortRefOptions(this.niveauxPersonnel);
    this.anneesScolaires = sortRefOptions(this.anneesScolaires);
    this.niveaux = sortRefOptions(this.niveaux);
    this.typesSie = sortRefOptions(this.typesSie);
    this.ecolesTutrices = sortRefOptions(this.ecolesTutrices);
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

  menaZoneImplantationOptions() {
    return menaRefSelectOptions(this.milieuxImplantation);
  }

  menaPartenaireLibelleOptions() {
    return menaRefLibelleStringOptions(this.partenaires);
  }

  menaPeriodiciteOptions() {
    return menaPeriodiciteSelectOptions(this.periodicites);
  }

  menaAnneeScolaireOptions() {
    return menaRefSelectOptions(this.anneesScolaires);
  }

  menaNiveauOptions() {
    return menaRefSelectOptions(this.niveaux);
  }

  menaTypeSieOptions() {
    return menaRefSelectOptions(this.typesSie);
  }

  menaTypePersonneMoraleOptions() {
    return menaRefSelectOptions(this.typePersonneMoraleOptions);
  }

  menaOrganisationFaitiereOptions() {
    return menaOrganisationFaitiereSelectOptions(this.organisationsFaitieres);
  }

  private applyWizardRefsAndRows(res: Record<string, unknown>): void {
    const page = res['rows'] as SpringPage<Record<string, unknown>>;
    const list = page?.content ?? [];
    this.totalElements = page?.totalElements ?? 0;
    this.totalPages = page?.totalPages ?? 0;
    this.rows = list.map((x) => this.mapRow(x));
    this.applyWizardRefs(res);
    this.loading = false;
    if (this.isListPage && !this.listGeoInitialized) {
      this.listGeoInitialized = true;
      if (this.applyListFilterFromSession()) {
        this.pageIndex = 0;
        this.loadAll();
      }
    }
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
      this.ensureCreateLocaliteId();
      const c = this.model.centre;
      return c.iepId != null && c.natureCentreId != null && c.localiteId != null;
    }
    if (this.stepIndex === 2) {
      const libelleOk = String(this.model.libelle ?? '').trim().length > 0;
      if (this.isSieWizard()) {
        return libelleOk && this.model.typeSieId != null;
      }
      return libelleOk && !this.hasInvalidNiveauRows();
    }
    return false;
  }

  canSubmit(): boolean {
    return !this.saving && this.stepIndex === 3 && !this.wizardSavedSuccess;
  }

  onEncadrerParMenaChange(value: boolean | null): void {
    if (value !== false) {
      this.model.centre.encadreurNonMena = '';
    }
  }

  onEditEncadrerParMenaChange(value: boolean | null): void {
    if (value !== false) {
      this.editForm.encadreurNonMena = null;
    }
  }

  next(): void {
    if (!this.canGoNext()) return;
    this.gpsHint = null;
    this.stepIndex = Math.min(3, this.stepIndex + 1);
  }

  prev(): void {
    if (this.saving) return;
    this.stepIndex = Math.max(0, this.stepIndex - 1);
  }

  goTo(i: number): void {
    if (this.saving || this.wizardLockedAfterSave) return;
    if (i <= this.stepIndex) {
      this.stepIndex = i;
      return;
    }
    if (i === this.stepIndex + 1 && this.canGoNext()) {
      this.stepIndex = i;
    }
  }

  resetWizard(): void {
    this.clearWizardSaveState();
    this.stepIndex = 0;
    this.model = {
      libelle: '',
      ecoleTutrice: '',
      anneeCreation: null,
      typeSieId: null,
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
        idMilieuImplentation: null,
        dateCreationDaaje: null,
      },
      niveaux: [],
    };
    this.promoteurMode = 'existing';
    this.wizardPromoteurDetails = null;
    this.createRegionId = null;
    this.createDrenaId = null;
    this.createDepartementId = null;
    this.createCommuneId = null;
    this.applySessionGeographyAnchors();
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
        libellePersonnePhysique: '',
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
        mail: '',
        idOrganisationFaitiere: null,
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
      libellePersonnePhysique: '',
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
      mail: '',
      idOrganisationFaitiere: null,
    };
    this.model.promoteur.personneMorale = null;
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
    this.createRegionId = this.createDepartementId != null ? this.departementRegionId(this.createDepartementId) : this.createRegionId;
    this.clearCreateChildrenFrom('departement');
  }

  onCreateCommuneChange(): void {
    if (this.model.centre.localiteId != null && !this.filteredCreateLocalites().some((localite) => localite.id === this.model.centre.localiteId)) {
      this.model.centre.localiteId = null as any;
    }
    this.ensureCreateLocaliteId();
  }

  onCreateLocaliteChange(): void {
    const localite = this.localites.find((item) => item.id === this.model.centre.localiteId);
    this.createCommuneId = localite?.commune?.id ?? this.createCommuneId;
    this.createDepartementId = localite ? this.localiteDepartementId(localite) : this.createDepartementId;
    this.createRegionId = this.createDepartementId != null ? this.departementRegionId(this.createDepartementId) : this.createRegionId;
    this.model.centre.idMilieuImplentation =
      localite?.milieuImplantation?.id ?? this.model.centre.idMilieuImplentation;
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
    this.editForm.idMilieuImplentation = localite?.milieuImplantation?.id ?? this.editForm.idMilieuImplentation;
  }

  milieuImplantationLabel(id: number | null | undefined, nomFallback?: string | null): string {
    if (id != null) {
      const found = this.milieuxImplantation.find((item) => item.id === id);
      if (found) return this.refOptionLibelle(found);
    }
    const nom = nomFallback?.trim();
    if (nom) return nom;
    return '—';
  }

  detailMilieuLabel(d: CentreDetailRow | null | undefined): string {
    if (!d) return '—';
    const fromNom = d.nomMilieuImplentation?.trim();
    if (fromNom) return fromNom;
    const localite = this.localites.find((item) => item.id === d.idLocalite);
    const fromLocalite = this.localiteMilieuImplantationLabel(localite);
    return fromLocalite || '—';
  }

  private resolveMilieuIdFromNom(nom: string | null | undefined): number | null {
    const label = nom?.trim();
    if (!label) return null;
    const found = this.milieuxImplantation.find(
      (item) => this.refOptionLibelle(item) === label || item.libelle?.trim() === label,
    );
    return found?.id ?? null;
  }

  selectedCreateMilieuImplantationLabel(): string {
    const localite = this.localites.find((item) => item.id === this.model.centre.localiteId);
    return (
      this.milieuImplantationLabel(this.model.centre.idMilieuImplentation) ||
      this.localiteMilieuImplantationLabel(localite) ||
      '—'
    );
  }

  selectedEditMilieuImplantationLabel(): string {
    const localite = this.localites.find((item) => item.id === this.editForm.idLocalite);
    return (
      this.milieuImplantationLabel(this.editForm.idMilieuImplentation) ||
      this.localiteMilieuImplantationLabel(localite) ||
      '—'
    );
  }

  anneeScolaireLabel(id: number | null | undefined): string {
    const found = this.anneesScolaires.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  niveauLabel(id: number | null | undefined): string {
    const found = this.niveaux.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  typeSieLabel(id: number | null | undefined): string {
    const found = this.typesSie.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  centreTypeForDashboard(): string {
    const p = (this.apiPath ?? '').toLowerCase();
    if (p.includes('/cec')) return 'CEC';
    if (p.includes('/cp')) return 'CP';
    if (p.includes('/sie')) return 'SIE';
    return 'ALPHA';
  }

  niveauApiPath(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cp')) return '/api/niveaucp';
    return '/api/niveausiecec';
  }

  niveauTitle(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cp')) return 'Niveau classe passerelle';
    if (p.includes('/cec')) return "Niveau centre d'éducation communautaire";
    return 'Niveau SIE';
  }

  salleTitle(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cp')) return 'Nombre de classes passerelle';
    if (p.includes('/cec')) return 'Nombre de salles';
    return 'Nombre de salles';
  }

  centreLibelleFieldLabel(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cp')) return 'Nom de la classe passerelle';
    if (p.includes('/cec')) return "Nom du centre d'éducation communautaire";
    return 'Nom du centre SIE';
  }

  addNiveau(): void {
    this.model.niveaux = this.model.niveaux ?? [];
    this.model.niveaux.push({
      anneeScolaireId: this.activeAnneeScolaireId,
      niveauId: null,
      nombreSalle: null,
    });
  }

  removeNiveau(index: number): void {
    this.model.niveaux = (this.model.niveaux ?? []).filter((_, i) => i !== index);
  }

  addEditNiveau(): void {
    this.editNiveaux = this.editNiveaux ?? [];
    this.editNiveaux.push({
      anneeScolaireId: this.activeAnneeScolaireId,
      niveauId: null,
      nombreSalle: null,
    });
  }

  removeEditNiveau(index: number): void {
    this.editNiveaux = (this.editNiveaux ?? []).filter((_, i) => i !== index);
  }

  resolveActiveAnneeScolaireId(): number | null {
    const active = this.anneesScolaires.find(
      (a) => (a as RefOption & { etatAnneeScolaire?: boolean }).etatAnneeScolaire === true,
    );
    if (active?.id != null) {
      return active.id;
    }
    return this.anneesScolaires.length === 1 ? this.anneesScolaires[0]?.id ?? null : null;
  }

  activeAnneeScolaireLabel(): string {
    return this.anneeScolaireLabel(this.activeAnneeScolaireId) || 'Année scolaire en cours';
  }

  hasInvalidNiveauRows(): boolean {
    return (this.model.niveaux ?? []).some((row) => row.anneeScolaireId == null || row.niveauId == null);
  }

  hasInvalidEditNiveauRows(): boolean {
    return (this.editNiveaux ?? []).some((row) => row.anneeScolaireId == null || row.niveauId == null);
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
          totalApprenants: d.totalApprenants ?? null,
          totalHommes: d.totalHommes ?? null,
          totalFemmes: d.totalFemmes ?? null,
          latitudeGps: d.latitudeGps ?? null,
          longitudeGps: d.longitudeGps ?? null,
          gpsValide: d.gpsValide ?? null,
          structurePartenaire: d.structurePartenaire ?? null,
          nomPartenaire: d.nomPartenaire ?? null,
          localisationCentre: d.localisationCentre ?? null,
          idMilieuImplentation:
            this.resolveMilieuIdFromNom(d.nomMilieuImplentation) ??
            this.localites.find((localite) => localite.id === d.idLocalite)?.milieuImplantation?.id ??
            null,
          encadreurNonMena: d.encadreurNonMena ?? null,
          encadrerParMena: d.encadrerParMena ?? null,
          idPromoteur: d.promoteur?.idPromoteur ?? d.idPromoteur ?? null,
          ecoleTutrice: d.ecoleTutrice ?? null,
          anneeCreation: d.anneeCreation ?? null,
          typeSieId: d.idTypeSie ?? d.typeSie?.id ?? null,
          actif: d.actif !== false,
        };
        this.syncEditTotalApprenants();
        this.editRegionId = d.region?.id ?? null;
        this.editDrenaId = d.drena?.id ?? this.ieps.find((iep) => iep.id === d.idIep)?.drena?.id ?? null;
        const selectedLocalite = this.localites.find((localite) => localite.id === d.idLocalite);
        this.editCommuneId = d.commune?.id ?? selectedLocalite?.commune?.id ?? null;
        this.editDepartementId = d.departement?.id ?? (selectedLocalite ? this.localiteDepartementId(selectedLocalite) : null);
        this.editRegionId = this.editRegionId ?? (this.editDepartementId != null ? this.departementRegionId(this.editDepartementId) : null);
        this.editNiveaux = this.niveauPayloadsFromDetails(d.niveaux ?? []);
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
    this.editNiveaux = [];
    this.editRegionId = null;
    this.editDrenaId = null;
    this.editDepartementId = null;
    this.editCommuneId = null;
  }

  canSaveEdit(): boolean {
    return (
      !this.saving &&
      !this.editLoading &&
      this.editRowId != null &&
      this.editForm.libelle.trim().length > 0 &&
      !this.hasInvalidEditNiveauRows()
    );
  }

  saveEdit(): void {
    if (!this.canSaveEdit()) return;
    this.syncEditTotalApprenants();
    this.sanitizeEditNonNegativeNumbers();
    const id = this.editRowId!;
    this.saving = true;
    const localite = this.localites.find((item) => item.id === this.editForm.idLocalite);
    let idMilieuImplentation = this.editForm.idMilieuImplentation;
    if (idMilieuImplentation == null) {
      idMilieuImplentation = localite?.milieuImplantation?.id ?? null;
    }
    const payload = {
      ...this.editForm,
      idMilieuImplentation,
      typeSieId: this.isSieWizard() ? this.editForm.typeSieId : null,
      niveaux: this.buildEditNiveauxPayload(),
    };
    this.http.put(`${this.apiBaseUrl}${this.apiPath}/${id}/infos`, payload).subscribe({
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

  toggleActif(row: Row): void {
    const currentlyActive = row.actif !== false;
    const nextActif = !currentlyActive;
    const msg = nextActif
      ? 'Réactiver ce centre ? Il sera de nouveau inclus dans les statistiques.'
      : 'Désactiver ce centre ? Il sera exclu des statistiques.';
    if (!confirm(msg)) return;
    this.saving = true;
    this.http
      .put(`${this.apiBaseUrl}${this.apiPath}/${row.idCentre}/actif`, { actif: nextActif })
      .subscribe({
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
    this.syncWizardTotalApprenants();
    this.sanitizeWizardNonNegativeNumbers();
    this.saving = true;
    this.errorMessage = null;
    const promoteurPayload = this.buildPromoteurPayload();
    const payload: SimpleFullCreatePayload = {
      libelle: String(this.model.libelle ?? '').trim(),
      ecoleTutrice: this.isCecWizard() ? this.trimToNull(this.model.ecoleTutrice) : null,
      anneeCreation: this.isCecWizard() ? this.sanitizeYear(this.model.anneeCreation) : null,
      typeSieId: this.isSieWizard() ? this.model.typeSieId : null,
      promoteur: promoteurPayload,
      centre: this.buildWizardCentrePayload(),
      niveaux: this.buildNiveauxPayload(),
    };
    this.http.post<Record<string, unknown>>(`${this.apiBaseUrl}${this.apiPath}`, payload).subscribe({
      next: (body) => {
        this.saving = false;
        this.savedFiche = wizardSavedFicheFromCreateResponse(body);
        this.wizardSavedSuccess = true;
        const code = this.savedFiche.codeCentre ?? '—';
        this.wizardSavedMessage = `Centre enregistré avec succès. Code centre : ${code}.`;
        this.stepIndex = 3;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  private isNationalScope(s: AuthSession | null): boolean {
    return isNationalView(s);
  }

  /** Pré-remplit région / DRENA / IEP / localité à partir du profil (hors rôles nationaux). */
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
    this.ensureCreateLocaliteId();
    if (this.model.centre.localiteId != null) {
      const loc = this.localites.find((l) => l.id === this.model.centre.localiteId);
      if (loc && this.createCommuneId == null) {
        this.createCommuneId = loc.commune?.id ?? null;
        this.createDepartementId = this.localiteDepartementId(loc);
        this.createRegionId =
          this.createDepartementId != null ? this.departementRegionId(this.createDepartementId) : null;
        if (this.createDrenaId == null && s.idDrena != null) {
          this.createDrenaId = s.idDrena;
        }
      }
    }
    if (s.idLocalite != null && this.model.centre.localiteId === s.idLocalite) {
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

  fillGpsFromMyPosition(): void {
    this.gpsHint = null;
    if (!navigator.geolocation) {
      this.gpsHint =
        'Géolocalisation indisponible sur cet appareil. Les coordonnées GPS sont facultatives — vous pouvez continuer sans elles.';
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.model.centre.latitudeGps = String(pos.coords.latitude);
        this.model.centre.longitudeGps = String(pos.coords.longitude);
        this.gpsHint = null;
      },
      () => {
        this.gpsHint =
          'Position GPS non obtenue. Les coordonnées sont facultatives — saisissez-les manuellement ou continuez sans GPS.';
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  /** Localité masquée à la saisie : injecte un id valide dès que le filtre géo le permet. */
  private ensureCreateLocaliteId(): void {
    const filtered = this.filteredCreateLocalites();
    if (filtered.length === 0) return;
    const current = this.model.centre.localiteId;
    if (current != null && filtered.some((l) => l.id === current)) return;
    const sessionLoc = this.auth.currentSession?.idLocalite ?? null;
    if (sessionLoc != null && filtered.some((l) => l.id === sessionLoc)) {
      this.model.centre.localiteId = sessionLoc;
      return;
    }
    if (
      this.createCommuneId == null &&
      this.createDepartementId == null &&
      this.createDrenaId == null &&
      this.createRegionId == null
    ) {
      return;
    }
    this.model.centre.localiteId = filtered[0].id;
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

  private libelleQueryParam(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cec')) return 'libelleCec';
    if (p.includes('/cp')) return 'libellleCp';
    return 'libelleSie';
  }

  onListSearchChange(): void {
    this.listTextSearchDebouncer.schedule(() => {
      this.pageIndex = 0;
      this.loadAll();
    });
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
    if (this.listFilterIepId != null) {
      p = p.set('idIep', String(this.listFilterIepId));
    } else if (this.listFilterDrenaId != null) {
      p = p.set('idDrena', String(this.listFilterDrenaId));
    }
    if (this.listFilterActif === 'yes') {
      p = p.set('actif', 'true');
    } else if (this.listFilterActif === 'no') {
      p = p.set('actif', 'false');
    }
    for (const [key, val] of Object.entries(this.simpleListFilter)) {
      const s = String(val ?? '').trim();
      if (s !== '' && key !== 'idIep') {
        p = p.set(key, s);
      }
    }
    return p;
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

  /** Pré-remplit les filtres liste selon le périmètre utilisateur. Retourne true si un filtre a été posé. */
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
      ecoleTutrice: (x['ecoleTutrice'] as string | undefined) ?? null,
      anneeCreation: this.optionalPositiveInt(x['anneeCreation']),
      actif: this.pickBool(x, 'actif') ?? true,
    };
  }

  private mapCentreDetailFromApi(x: Record<string, unknown>): CentreDetailRow {
    const base = this.mapRow(x);
    return {
      ...base,
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
      idTypeSie: this.optionalPositiveInt(x['idTypeSie']),
      typeSie: this.asCentreRef(x['typeSie']),
      niveaux: this.asNiveauDetailsArray(x['niveaux']),
    };
  }

  refCentreLabel(ref: CentreRefDetails | null | undefined, fallback: () => string): string {
    if (!ref) return fallback();
    const l = ref.libelle?.trim();
    if (l) return l;
    const c = ref.code?.trim();
    if (c) return c;
    if (ref.id != null) return `#${ref.id}`;
    return fallback();
  }

  detailLocaliteLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.localite, () => this.localiteLabel(d.idLocalite ?? null));
  }

  detailTypeSieLabel(d: CentreDetailRow): string {
    return this.refCentreLabel(d.typeSie, () => this.typeSieLabel(d.idTypeSie ?? null));
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
        value['libelleNiveauPersonnel'] ??
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

  private localiteMilieuImplantationLabel(localite: LocaliteOption | null | undefined): string {
    return this.refCentreLabel(localite?.milieuImplantation, () => '');
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

  recapWizardExistingPromoteurDetails(): PromoteurOption | null {
    if (this.wizardPromoteurDetails) {
      return this.wizardPromoteurDetails;
    }
    const id = this.model.promoteur?.id;
    if (id == null) return null;
    return this.promoteurs.find((x) => x.id === id) ?? null;
  }

  wizardRecapCodeCentre(): string {
    if (this.savedFiche?.codeCentre) {
      return this.savedFiche.codeCentre;
    }
    return 'Attribué à l’enregistrement';
  }

  wizardRecapLibelle(): string {
    return this.savedFiche?.libelle?.trim() || String(this.model.libelle ?? '').trim() || '—';
  }

  recapWizardTypePersonneMoraleLabel(): string {
    const id = this.model.promoteur?.personneMorale?.idTypePersonneMorale;
    if (id == null) return '—';
    const t = this.typePersonneMoraleOptions.find((x) => x.id === id);
    return t ? this.refOptionLabel(t) : `#${id}`;
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

  menaEcoleTutriceOptions() {
    return menaRefLibelleStringOptions(this.ecolesTutrices, (o) => {
      const label = (o.libelle ?? o.code ?? '').trim();
      return label || (o.id != null ? `École #${o.id}` : '');
    });
  }

  private buildNiveauxPayload(): CentreTypeNiveauPayload[] {
    return (this.model.niveaux ?? [])
      .filter((row) => row.anneeScolaireId != null && row.niveauId != null)
      .map((row) => ({
        anneeScolaireId: row.anneeScolaireId,
        niveauId: row.niveauId,
        nombreSalle: this.nonNegativeIntOrNull(row.nombreSalle),
        codeNiveau: row.codeNiveau?.trim() || null,
      }));
  }

  private buildWizardCentrePayload(): SimpleFullCreatePayload['centre'] {
    const c = this.model.centre;
    const localite = this.localites.find((item) => item.id === c.localiteId);
    let idMilieuImplentation = c.idMilieuImplentation ?? null;
    if (idMilieuImplentation == null) {
      idMilieuImplentation = localite?.milieuImplantation?.id ?? null;
    }
    return {
      localiteId: c.localiteId,
      periodiciteId: c.periodiciteId,
      iepId: c.iepId,
      autoriteAutorisationId: c.autoriteAutorisationId,
      natureCentreId: c.natureCentreId,
      autorisation: c.autorisation,
      encadreurNonMena: this.trimToNull(c.encadreurNonMena) ?? null,
      encadrerParMena: c.encadrerParMena,
      estElectrifie: c.estElectrifie,
      aDeLeau: c.aDeLeau,
      nombreVisite: c.nombreVisite,
      totalApprenants: c.totalApprenants,
      totalHommes: c.totalHommes,
      totalFemmes: c.totalFemmes,
      latitudeGps: this.trimToNull(c.latitudeGps) ?? null,
      longitudeGps: this.trimToNull(c.longitudeGps) ?? null,
      gpsValide: c.gpsValide,
      structurePartenaire: this.trimToNull(c.structurePartenaire) ?? null,
      nomPartenaire: this.trimToNull(c.nomPartenaire) ?? null,
      localisationCentre: this.trimToNull(c.localisationCentre) ?? null,
      idMilieuImplentation,
      dateCreationDaaje: c.dateCreationDaaje ?? null,
    };
  }

  private buildEditNiveauxPayload(): CentreTypeNiveauPayload[] {
    return (this.editNiveaux ?? [])
      .filter((row) => row.anneeScolaireId != null && row.niveauId != null)
      .map((row) => ({
        anneeScolaireId: row.anneeScolaireId,
        niveauId: row.niveauId,
        nombreSalle: this.nonNegativeIntOrNull(row.nombreSalle),
        codeNiveau: row.codeNiveau?.trim() || null,
      }));
  }

  private niveauPayloadsFromDetails(niveaux: CentreNiveauDetails[]): CentreTypeNiveauPayload[] {
    return niveaux.map((niveau) => ({
      anneeScolaireId: niveau.anneeScolaire?.id ?? null,
      niveauId: niveau.niveauId ?? null,
      nombreSalle: niveau.nombreSalle ?? null,
      codeNiveau: niveau.codeNiveau ?? null,
    }));
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
            mail: this.trimToNull(rawPp.mail),
            idOrganisationFaitiere: rawPp.idOrganisationFaitiere ?? null,
          }
        : null;
    return {
      libellePromoteur: null,
      typePromoteur: this.model.promoteur.typePromoteur ?? null,
      personnePhysique,
      personneMorale: this.model.promoteur.personneMorale ?? null,
    };
  }

  applyListFilters(): void {
    this.listTextSearchDebouncer.runNow(() => {
      this.pageIndex = 0;
      this.loadAll();
    });
  }

  ngOnDestroy(): void {
    this.listTextSearchDebouncer.cancel();
  }

  resetListFilters(): void {
    this.listTextSearchDebouncer.cancel();
    this.searchQ = '';
    this.listFilterDrenaId = null;
    this.listFilterIepId = null;
    this.listFilterActif = 'all';
    for (const k of Object.keys(this.simpleListFilter)) {
      this.simpleListFilter[k] = '';
    }
    this.applyListFilterFromSession();
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

  isCecWizard(): boolean {
    return (this.apiPath ?? '').includes('/cec');
  }

  isSieWizard(): boolean {
    return (this.apiPath ?? '').includes('/sie');
  }

  wizardPromoteurFonctionLabel(): string {
    return this.isCecWizard() ? 'Profession' : 'Fonction';
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

  private sanitizeYear(v: number | null | undefined): number | null {
    if (v == null || !Number.isFinite(v)) return null;
    const y = Math.trunc(v);
    if (y < 1800 || y > 2100) return null;
    return y;
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

