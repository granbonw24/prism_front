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
  CentreNiveauDetails,
  CentreRefDetails,
  CentreRow as Row,
  CentreTypeNiveauPayload,
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
  drenas: RefOption[] = [];
  departements: RefOption[] = [];
  communes: RefOption[] = [];
  sousPrefectures: SousPrefectureOption[] = [];
  promoteurs: PromoteurOption[] = [];
  typePersonneMoraleOptions: RefOption[] = [];
  anneesScolaires: RefOption[] = [];
  niveaux: RefOption[] = [];
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
  editNiveaux: CentreTypeNiveauPayload[] = [];

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
      drenas: this.http.get<any[]>(`${this.apiBaseUrl}/api/drena`),
      departements: this.http.get<any[]>(`${this.apiBaseUrl}/api/departement`),
      communes: this.http.get<any[]>(`${this.apiBaseUrl}/api/commune`),
      sousPrefectures: this.http.get<any[]>(`${this.apiBaseUrl}/api/sous-prefecture`),
      natures: this.http.get<NatureOption[]>(`${this.apiBaseUrl}/api/naturecentre`),
      periodicites: this.http.get<PeriodiciteOption[]>(`${this.apiBaseUrl}/api/Periodicites`),
      autorites: this.http.get<AutoriteOption[]>(`${this.apiBaseUrl}/api/autoriteautorisation`),
      promoteurs: this.http.get<any[]>(`${this.apiBaseUrl}/api/promoteur`),
      typePersonneMorales: this.http.get<any[]>(`${this.apiBaseUrl}/api/type-personne-morale`),
      anneesScolaires: this.http.get<any[]>(`${this.apiBaseUrl}/api/anneescolaire`),
      niveaux: this.http.get<any[]>(`${this.apiBaseUrl}${this.niveauApiPath()}`),
    }).subscribe({
      next: (res) => {
        const page = res.rows;
        const list = page.content ?? [];
        this.totalElements = page.totalElements ?? 0;
        this.totalPages = page.totalPages ?? 0;
        this.rows = list.map((x) => this.mapRow(x));
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
        this.anneesScolaires = (res.anneesScolaires ?? []).map((x: any) => ({
          id: x.id,
          code: x.codeAnneeScolaire ?? x.code ?? undefined,
          libelle:
            x.debutAnneeScolaire != null && x.finAnneeScolaire != null
              ? `${x.debutAnneeScolaire} - ${x.finAnneeScolaire}`
              : x.libelle ?? x.libelleAnneeScolaire ?? undefined,
        }));
        this.niveaux = (res.niveaux ?? []).map((x: any) => ({
          id: x.id,
          code: x.codeNiveauCp ?? x.codeNiveauSie ?? x.code ?? undefined,
          libelle:
            x.libelleNiveauCp ??
            x.libelleNiveauSie ??
            x.libelleNiveau ??
            x.libelle ??
            undefined,
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
      return String(this.model.libelle ?? '').trim().length > 0 && !this.hasInvalidNiveauRows();
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

  anneeScolaireLabel(id: number | null | undefined): string {
    const found = this.anneesScolaires.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  niveauLabel(id: number | null | undefined): string {
    const found = this.niveaux.find((x) => x.id === id);
    return found ? this.refOptionLibelle(found) : '—';
  }

  niveauApiPath(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cp')) return '/api/niveaucp';
    return '/api/niveausiecec';
  }

  niveauTitle(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cp')) return 'Niveau CP';
    if (p.includes('/cec')) return 'Niveau CEC';
    return 'Niveau SIE';
  }

  salleTitle(): string {
    const p = this.apiPath ?? '';
    if (p.includes('/cp')) return 'Salles CP';
    if (p.includes('/cec')) return 'Salles CEC';
    return 'Salles SIE';
  }

  addNiveau(): void {
    this.model.niveaux = this.model.niveaux ?? [];
    this.model.niveaux.push({ anneeScolaireId: null, niveauId: null, nombreSalle: null });
  }

  removeNiveau(index: number): void {
    this.model.niveaux = (this.model.niveaux ?? []).filter((_, i) => i !== index);
  }

  addEditNiveau(): void {
    this.editNiveaux = this.editNiveaux ?? [];
    this.editNiveaux.push({ anneeScolaireId: null, niveauId: null, nombreSalle: null });
  }

  removeEditNiveau(index: number): void {
    this.editNiveaux = (this.editNiveaux ?? []).filter((_, i) => i !== index);
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
          nomMilieuImplentation: d.nomMilieuImplentation ?? null,
          encadreurNonMena: d.encadreurNonMena ?? null,
          encadrerParMena: d.encadrerParMena ?? null,
          idPromoteur: d.promoteur?.idPromoteur ?? d.idPromoteur ?? null,
        };
        this.editDrenaId = d.drena?.id ?? this.ieps.find((iep) => iep.id === d.idIep)?.drena?.id ?? null;
        const selectedLocalite = this.localites.find((localite) => localite.id === d.idLocalite);
        this.editCommuneId = d.commune?.id ?? selectedLocalite?.commune?.id ?? null;
        this.editDepartementId = d.departement?.id ?? (selectedLocalite ? this.localiteDepartementId(selectedLocalite) : null);
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
    const id = this.editRowId!;
    this.saving = true;
    const payload = {
      ...this.editForm,
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

  submit(): void {
    if (!this.canSubmit()) return;
    this.saving = true;
    this.errorMessage = null;
    const promoteurPayload = this.buildPromoteurPayload();
    const payload: SimpleFullCreatePayload = {
      libelle: String(this.model.libelle ?? '').trim(),
      promoteur: promoteurPayload,
      centre: { ...this.model.centre },
      niveaux: this.buildNiveauxPayload(),
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
    const id = this.model.promoteur?.id;
    if (id == null) return null;
    return this.promoteurs.find((x) => x.id === id) ?? null;
  }

  recapWizardTypePersonneMoraleLabel(): string {
    const id = this.model.promoteur?.personneMorale?.idTypePersonneMorale;
    if (id == null) return '—';
    const t = this.typePersonneMoraleOptions.find((x) => x.id === id);
    return t ? this.refOptionLabel(t) : `#${id}`;
  }

  private buildNiveauxPayload(): CentreTypeNiveauPayload[] {
    return (this.model.niveaux ?? [])
      .filter((row) => row.anneeScolaireId != null && row.niveauId != null)
      .map((row) => ({
        anneeScolaireId: row.anneeScolaireId,
        niveauId: row.niveauId,
        nombreSalle: row.nombreSalle ?? null,
        codeNiveau: row.codeNiveau?.trim() || null,
      }));
  }

  private buildEditNiveauxPayload(): CentreTypeNiveauPayload[] {
    return (this.editNiveaux ?? [])
      .filter((row) => row.anneeScolaireId != null && row.niveauId != null)
      .map((row) => ({
        anneeScolaireId: row.anneeScolaireId,
        niveauId: row.niveauId,
        nombreSalle: row.nombreSalle ?? null,
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

