import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  drenas: RefOption[] = [];
  departements: RefOption[] = [];
  communes: RefOption[] = [];
  sousPrefectures: SousPrefectureOption[] = [];
  promoteurs: PromoteurOption[] = [];
  typePersonneMoraleOptions: RefOption[] = [];
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
      nombreVisite: 0,
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
  editDrenaId: number | null = null;
  editDepartementId: number | null = null;
  editCommuneId: number | null = null;
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
      drenas: this.http.get<any[]>(`${this.apiBaseUrl}/api/drena`),
      departements: this.http.get<any[]>(`${this.apiBaseUrl}/api/departement`),
      communes: this.http.get<any[]>(`${this.apiBaseUrl}/api/commune`),
      sousPrefectures: this.http.get<any[]>(`${this.apiBaseUrl}/api/sous-prefecture`),
      natures: this.http.get<NatureOption[]>(`${this.apiBaseUrl}/api/naturecentre`),
      periodicites: this.http.get<PeriodiciteOption[]>(`${this.apiBaseUrl}/api/Periodicites`),
      autorites: this.http.get<AutoriteOption[]>(`${this.apiBaseUrl}/api/autoriteautorisation`),
      promoteurs: this.http.get<any[]>(`${this.apiBaseUrl}/api/promoteur`),
      typePersonneMorales: this.http.get<any[]>(`${this.apiBaseUrl}/api/type-personne-morale`),
      niveauxAlpha: this.http.get<any[]>(`${this.apiBaseUrl}/api/niveaualpha`),
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
        this.drenas = (res.drenas ?? []).map((x: any) => this.refOptionFromApi(x));
        this.departements = (res.departements ?? []).map((x: any) => this.refOptionFromApi(x));
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
        this.niveauAlphaOptions = this.uniqueRefOptions(
          (res.niveauxAlpha ?? []).map((x: any) => ({
            id: x.id,
            code: x.codeNiveauAlpha ?? x.code ?? undefined,
            libelle: x.libelleNiveauAlpha ?? x.libelleNiveau ?? x.libelle ?? undefined,
          })),
        );
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

  departementLabel(id: number | null | undefined): string {
    const found = this.departements.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  communeLabel(id: number | null | undefined): string {
    const found = this.communes.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  filteredEditIeps(): IepOption[] {
    if (this.editDrenaId == null) return this.ieps;
    return this.ieps.filter((iep) => iep.drena?.id === this.editDrenaId);
  }

  filteredEditCommunes(): RefOption[] {
    if (this.editDepartementId == null) return this.communes;
    const communeIds = new Set(
      this.localites
        .filter((localite) => this.localiteDepartementId(localite) === this.editDepartementId)
        .map((localite) => localite.commune?.id)
        .filter((id): id is number => id != null),
    );
    return this.communes.filter((commune) => communeIds.has(commune.id));
  }

  filteredEditLocalites(): LocaliteOption[] {
    return this.localites.filter((localite) => {
      const matchesDepartement = this.editDepartementId == null || this.localiteDepartementId(localite) === this.editDepartementId;
      const matchesCommune = this.editCommuneId == null || localite.commune?.id === this.editCommuneId;
      return matchesDepartement && matchesCommune;
    });
  }

  onEditDrenaChange(): void {
    if (this.editForm.idIep != null && !this.filteredEditIeps().some((iep) => iep.id === this.editForm.idIep)) {
      this.editForm.idIep = null;
    }
  }

  onEditIepChange(): void {
    const iep = this.ieps.find((item) => item.id === this.editForm.idIep);
    this.editDrenaId = iep?.drena?.id ?? null;
  }

  onEditDepartementChange(): void {
    if (this.editCommuneId != null && !this.filteredEditCommunes().some((commune) => commune.id === this.editCommuneId)) {
      this.editCommuneId = null;
    }
    if (this.editForm.idLocalite != null && !this.filteredEditLocalites().some((localite) => localite.id === this.editForm.idLocalite)) {
      this.editForm.idLocalite = null;
    }
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
        this.editDrenaId = d.drena?.id ?? this.ieps.find((iep) => iep.id === d.idIep)?.drena?.id ?? null;
        const selectedLocalite = this.localites.find((localite) => localite.id === d.idLocalite);
        this.editCommuneId = d.commune?.id ?? selectedLocalite?.commune?.id ?? null;
        this.editDepartementId = d.departement?.id ?? (selectedLocalite ? this.localiteDepartementId(selectedLocalite) : null);
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
    this.editDrenaId = null;
    this.editDepartementId = null;
    this.editCommuneId = null;
  }

  canSaveEdit(): boolean {
    return !this.saving && !this.editLoading && this.editRowId != null && this.editForm.libelle.trim().length > 0;
  }

  saveEdit(): void {
    if (!this.canSaveEdit()) return;
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
    if (ref.id != null) return `#${ref.id}`;
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

  recapWizardExistingPromoteurDetails(): PromoteurOption | null {
    const id = this.model.promoteur?.id;
    if (id == null) return null;
    return this.promoteurs.find((x) => x.id === id) ?? null;
  }

  /** Libellé du type personne morale sélectionné (récap wizard). */
  recapWizardTypePersonneMoraleLabel(): string {
    const id = this.model.promoteur?.personneMorale?.idTypePersonneMorale;
    if (id == null) return '—';
    const t = this.typePersonneMoraleOptions.find((x) => x.id === id);
    return t ? this.refOptionLabel(t) : `#${id}`;
  }

  private buildAlphaNiveauxPayload(): AlphaNiveauPayload[] {
    return this.buildAlphaNiveauxPayloadFromIds(this.selectedNiveauAlphaOptionIds);
  }

  private buildAlphaNiveauxPayloadFromIds(ids: number[]): AlphaNiveauPayload[] {
    return this.alphaNiveauOptionsForIds(ids)
      .map((option) => ({
        codeNiveauAlpha: option.code?.trim() || null,
        libelleNiveauAlpha: String(option.libelle ?? this.refOptionLibelle(option)).trim(),
      }));
  }

  private alphaNiveauOptionIdsFromDetails(niveaux: CentreNiveauDetails[]): number[] {
    const ids: number[] = [];
    for (const niveau of niveaux) {
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

