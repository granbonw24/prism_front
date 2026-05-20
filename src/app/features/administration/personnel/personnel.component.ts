import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { forkJoin } from 'rxjs';
import { PersonnelAdmin } from '@models/administration';
import { AdministrationService, PersonnelListQuery } from '@services/administration.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { MenaRowActionButtonComponent } from '@shared/mena-row-action-button/mena-row-action-button.component';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import {
  refEntityLabelForSelect,
  sortByLabel,
  toMenaSelectOptions,
  toMenaSelectOptionsFromPairs,
} from '@shared/mena-searchable-select/mena-select-options.util';
import { MenaToolbarButtonComponent } from '@shared/mena-toolbar-button/mena-toolbar-button.component';
import { MenaContextDashboardComponent } from '@shared/mena-context-dashboard/mena-context-dashboard.component';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import {
  MenaRecordDetailField,
  MenaRecordDetailModalComponent,
} from '@shared/mena-record-detail-modal/mena-record-detail-modal.component';

export type CentreTypeFilter = '' | 'ALPHA' | 'CEC' | 'CP' | 'SIE';

type PersonnelCentreOption = {
  id?: number;
  codeCentre?: string | null;
  libelle?: string | null;
  localisationCentre?: string | null;
  centreType?: 'ALPHA' | 'CEC' | 'CP' | 'SIE';
};

@Component({
  selector: 'app-personnel-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MenaRowActionButtonComponent,
    MenaSearchableSelectComponent,
    MenaToolbarButtonComponent,
    MenaContextDashboardComponent,
    MenaRecordDetailModalComponent,
    MenaLoadingComponent,
  ],
  templateUrl: './personnel.component.html',
  styleUrl: './personnel.component.css',
})
export class PersonnelComponent implements OnInit {
  /** Filtre 1 : type de centre, puis centre. */
  centreTypeFilter: CentreTypeFilter = '';

  centreId: number | null = null;

  rows: PersonnelAdmin[] = [];

  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  /** Filtres de la liste (réutilisent les référentiels déjà chargés). */
  listFilter: {
    idFonction: number | null;
    idStatutPersonnel: number | null;
    idNiveauPersonnel: number | null;
    idCivilite: number | null;
    sexePersonnel: string;
    q: string;
  } = {
    idFonction: null,
    idStatutPersonnel: null,
    idNiveauPersonnel: null,
    idCivilite: null,
    sexePersonnel: '',
    q: '',
  };

  centres: PersonnelCentreOption[] = [];
  centresLoading = false;

  private readonly centreApiByType: Record<'ALPHA' | 'CEC' | 'CP' | 'SIE', string> = {
    ALPHA: '/api/alpha',
    CEC: '/api/cec',
    CP: '/api/cp',
    SIE: '/api/sie',
  };
  fonctions: any[] = [];
  civilites: any[] = [];
  niveaux: any[] = [];
  statuts: any[] = [];
  diplomes: any[] = [];
  structuresFormation: any[] = [];

  refsLoading = false;
  listLoading = false;
  saving = false;
  errorMessage: string | null = null;

  detailModalOpen = false;
  detailFields: MenaRecordDetailField[] = [];
  detailSubtitle = '';

  constructor(
    private readonly admin: AdministrationService,
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {
    this.loadRefs();
  }

  ngOnInit(): void {
    const centreQ = this.route.snapshot.queryParamMap.get('centreId');
    const typeQ = this.route.snapshot.queryParamMap.get('centreType') as CentreTypeFilter | null;
    if (typeQ && ['ALPHA', 'CEC', 'CP', 'SIE', ''].includes(typeQ)) {
      this.centreTypeFilter = typeQ;
    }
    if (centreQ != null && centreQ !== '') {
      const id = Number(centreQ);
      if (Number.isFinite(id)) {
        this.centreId = id;
      }
    }
  }

  get loading(): boolean {
    return this.refsLoading || this.listLoading || this.centresLoading;
  }

  get selectedCentreKind(): 'ALPHA' | 'CEC' | 'CP' | 'SIE' | 'AUTRE' {
    if (this.centreTypeFilter) {
      return this.centreTypeFilter;
    }
    const centre = this.centres.find((c) => c.id === this.centreId);
    if (centre?.centreType) {
      return centre.centreType;
    }
    return this.centreKindFromCode(centre?.codeCentre);
  }

  get filteredCentres(): PersonnelCentreOption[] {
    return this.centres;
  }

  get personnelCentreTypeForDash(): string | undefined {
    return this.centreTypeFilter || undefined;
  }

  get centreTypeLabel(): string {
    const labels: Record<CentreTypeFilter, string> = {
      '': 'Tous les types',
      ALPHA: 'Centre Alpha',
      CEC: 'Centre CEC',
      CP: 'Centre CP',
      SIE: 'Centre SIE',
    };
    return labels[this.centreTypeFilter];
  }

  loadRefs(): void {
    this.refsLoading = true;
    this.errorMessage = null;

    forkJoin({
      fonctions: this.http.get<unknown>(`${this.apiBaseUrl}/api/fonctions`),
      civilites: this.http.get<unknown>(`${this.apiBaseUrl}/api/civilite`),
      niveaux: this.http.get<unknown>(`${this.apiBaseUrl}/api/niveau-personnel`),
      statuts: this.http.get<unknown>(`${this.apiBaseUrl}/api/StatutPersonnels`),
      diplomes: this.http.get<unknown>(`${this.apiBaseUrl}/api/diplome`),
      structuresFormation: this.http.get<unknown>(`${this.apiBaseUrl}/api/structure-formation-certification`),
    }).subscribe({
      next: (res) => {
        this.fonctions = sortByLabel(unwrapListBody(res.fonctions) as any[], (f) => this.fonctionLabel(f));
        this.civilites = sortByLabel(unwrapListBody(res.civilites) as any[], (c) => this.civiliteLabel(c));
        this.niveaux = sortByLabel(unwrapListBody(res.niveaux) as any[], (n) => this.niveauLabel(n));
        this.statuts = sortByLabel(unwrapListBody(res.statuts) as any[], (s) => this.statutLabel(s));
        this.diplomes = sortByLabel(unwrapListBody(res.diplomes) as any[], (d) => this.diplomeLabel(d));
        this.structuresFormation = sortByLabel(unwrapListBody(res.structuresFormation) as any[], (s) =>
          this.structureFormationLabel(s),
        );
        this.refsLoading = false;
        this.loadCentresForType();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.refsLoading = false;
      },
    });
  }

  /** Même source que le menu Centres (alpha / cec / cp / sie), pas la table générique /api/centres. */
  loadCentresForType(): void {
    const types: Array<'ALPHA' | 'CEC' | 'CP' | 'SIE'> = this.centreTypeFilter
      ? [this.centreTypeFilter]
      : ['ALPHA', 'CEC', 'CP', 'SIE'];

    this.centresLoading = true;
    const params = new HttpParams({
      fromObject: { page: '0', size: '2000', sort: 'id,asc' },
    });

    forkJoin(
      types.map((type) =>
        this.http.get<unknown>(`${this.apiBaseUrl}${this.centreApiByType[type]}`, { params }),
      ),
    ).subscribe({
      next: (bodies) => {
        const merged: PersonnelCentreOption[] = [];
        types.forEach((type, index) => {
          const rows = unwrapListBody(bodies[index]) as Record<string, unknown>[];
          for (const row of rows) {
            merged.push(this.mapTypedCentreRow(row, type));
          }
        });
        this.centres = sortByLabel(merged, (c) => this.centreLabel(c));
        this.centresLoading = false;
        if (this.centreId != null) {
          this.reload();
        }
      },
      error: (e) => {
        this.centres = [];
        this.centresLoading = false;
        this.errorMessage = this.formatError(e);
      },
    });
  }

  private mapTypedCentreRow(
    row: Record<string, unknown>,
    type: 'ALPHA' | 'CEC' | 'CP' | 'SIE',
  ): PersonnelCentreOption {
    const idRaw = row['idCentre'] ?? row['id'];
    const id = typeof idRaw === 'number' ? idRaw : idRaw != null ? Number(idRaw) : undefined;
    return {
      id: Number.isFinite(id) ? id : undefined,
      codeCentre: (row['codeCentre'] ?? row['codeType'] ?? null) as string | null,
      libelle: (row['libelle'] ?? null) as string | null,
      localisationCentre: (row['localisationCentre'] ?? null) as string | null,
      centreType: type,
    };
  }

  onCentreTypeChange(): void {
    if (this.centreId != null && !this.centres.some((c) => c.id === this.centreId)) {
      this.centreId = null;
      this.rows = [];
      this.totalElements = 0;
      this.totalPages = 0;
      this.resetListFilters(false);
    }
    this.loadCentresForType();
  }

  onCentreChange(): void {
    if (this.centreId == null) {
      this.rows = [];
      this.pageIndex = 0;
      this.resetListFilters(false);
      return;
    }
    this.pageIndex = 0;
    this.resetListFilters(false);
    this.reload();
  }

  private buildListQuery(): PersonnelListQuery {
    return {
      idFonction: this.listFilter.idFonction,
      idStatutPersonnel: this.listFilter.idStatutPersonnel,
      idNiveauPersonnel: this.listFilter.idNiveauPersonnel,
      idCivilite: this.listFilter.idCivilite,
      sexePersonnel: this.listFilter.sexePersonnel,
      q: this.listFilter.q,
    };
  }

  /** Réinitialise les critères de liste ; si {@code reloadList} recharge la grille. */
  resetListFilters(reloadList = true): void {
    this.listFilter = {
      idFonction: null,
      idStatutPersonnel: null,
      idNiveauPersonnel: null,
      idCivilite: null,
      sexePersonnel: '',
      q: '',
    };
    this.pageIndex = 0;
    if (reloadList && this.centreId != null) {
      this.reload();
    }
  }

  applyListFilters(): void {
    if (this.centreId == null) return;
    this.pageIndex = 0;
    this.reload();
  }

  reload(): void {
    if (this.centreId == null) return;
    this.listLoading = true;
    this.errorMessage = null;
    this.admin.listPersonnelByCentrePage(this.centreId, this.pageIndex, this.pageSize, this.buildListQuery()).subscribe({
      next: (page) => {
        this.rows = page.content ?? [];
        this.totalPages = page.totalPages ?? 0;
        this.totalElements = page.totalElements ?? 0;
        this.listLoading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.listLoading = false;
      },
    });
  }

  goPrevPage(): void {
    if (this.centreId == null || this.pageIndex <= 0 || this.loading) return;
    this.pageIndex--;
    this.reload();
  }

  goNextPage(): void {
    if (this.centreId == null || this.loading) return;
    const tp = this.totalPages;
    if (tp <= 0 || this.pageIndex >= tp - 1) return;
    this.pageIndex++;
    this.reload();
  }

  onPageSizeChange(): void {
    if (this.centreId == null) return;
    this.pageIndex = 0;
    this.reload();
  }

  canGoPrevPage(): boolean {
    return this.centreId != null && this.pageIndex > 0 && !this.loading;
  }

  canGoNextPage(): boolean {
    const tp = this.totalPages;
    if (this.centreId == null || tp <= 0 || this.loading) return false;
    return this.pageIndex < tp - 1;
  }

  get displayTotalPages(): number {
    return this.totalPages > 0 ? this.totalPages : 1;
  }

  goToCreate(): void {
    if (this.centreId == null) return;
    void this.router.navigate(['/personnel/nouveau'], {
      queryParams: { centreId: this.centreId, centreType: this.centreTypeFilter || undefined },
    });
  }

  goToEdit(row: PersonnelAdmin): void {
    void this.router.navigate(['/personnel', row.id, 'modifier'], {
      queryParams: { centreId: row.centreId ?? this.centreId ?? undefined, centreType: this.centreTypeFilter || undefined },
      state: { row },
    });
  }

  openDetails(row: PersonnelAdmin): void {
    this.detailModalOpen = true;
    this.detailSubtitle = `${row.nomPersonnel ?? ''} ${row.prenomsPersonnel ?? ''}`.trim();
    this.detailFields = this.buildPersonnelDetailFields(row);
  }

  closeDetails(): void {
    this.detailModalOpen = false;
    this.detailFields = [];
    this.detailSubtitle = '';
  }

  private buildPersonnelDetailFields(row: PersonnelAdmin): MenaRecordDetailField[] {
    const yesNo = (v: boolean | null | undefined) =>
      v === true ? 'Oui' : v === false ? 'Non' : '—';
    return [
      { label: 'Code', value: row.codePersonnel?.trim() || '—' },
      { label: 'Nom', value: row.nomPersonnel?.trim() || '—' },
      { label: 'Prénoms', value: row.prenomsPersonnel?.trim() || '—' },
      { label: 'Civilité', value: this.labelFromRef(this.civilites, row.civiliteId, (c) => this.civiliteLabel(c)) },
      { label: 'Fonction', value: this.labelFromRef(this.fonctions, row.fonctionId, (f) => this.fonctionLabel(f)) },
      { label: 'Statut', value: this.labelFromRef(this.statuts, row.statutPersonnelId, (s) => this.statutLabel(s)) },
      { label: 'Niveau', value: this.labelFromRef(this.niveaux, row.niveauPersonnelId, (n) => this.niveauLabel(n)) },
      { label: 'Diplôme', value: this.labelFromRef(this.diplomes, row.diplomeId ?? null, (d) => this.diplomeLabel(d)) },
      { label: 'Contact', value: row.contactPersonnel?.trim() || '—' },
      { label: 'Email', value: row.emailPersonnel?.trim() || '—' },
      { label: 'Sexe', value: row.sexePersonnel?.trim() || '—' },
      { label: 'Date de naissance', value: row.dateNaissance?.trim() || '—' },
      { label: 'Années d’expérience', value: row.anneExpePersonnel != null ? String(row.anneExpePersonnel) : '—' },
      { label: 'Certifié', value: yesNo(row.certifierPersonnel) },
      {
        label: 'Structure de formation',
        value: this.labelFromRef(
          this.structuresFormation,
          row.structureFormationCertificationId,
          (s) => this.structureFormationLabel(s),
        ),
      },
      { label: 'Dénomination', value: row.denominationPersonnel?.trim() || '—' },
      { label: 'Programme', value: row.nomDuPrgramme?.trim() || '—' },
      { label: 'Représentant légal', value: row.nomRepresentantLegalSturcture?.trim() || '—' },
    ];
  }

  private labelFromRef(
    list: Record<string, unknown>[],
    id: number | null | undefined,
    labelFn: (row: Record<string, unknown>) => string,
  ): string {
    if (id == null) {
      return '—';
    }
    const hit = list.find((x) => x['id'] === id);
    return hit ? labelFn(hit) : `#${id}`;
  }

  deleteRow(row: PersonnelAdmin): void {
    if (this.saving) return;
    if (!confirm(`Supprimer ${row.nomPersonnel ?? ''} ${row.prenomsPersonnel ?? ''} ?`)) return;
    this.saving = true;
    this.errorMessage = null;
    this.admin.deletePersonnel(row.id).subscribe({
      next: () => {
        this.saving = false;
        this.reload();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  centreLabel(c: PersonnelCentreOption): string {
    const libelle = c.libelle?.trim() || c.localisationCentre?.trim();
    return libelle || `Centre #${c.id ?? '?'}`;
  }

  fonctionLabel(f: Record<string, unknown>): string {
    return refEntityLabelForSelect(f, ['libelleFonction']);
  }

  civiliteLabel(c: Record<string, unknown>): string {
    return refEntityLabelForSelect(c, ['libelleCivilite']);
  }

  niveauLabel(n: Record<string, unknown>): string {
    return refEntityLabelForSelect(n, ['libelleNiveauPersonnel']);
  }

  statutLabel(s: Record<string, unknown>): string {
    return refEntityLabelForSelect(s, ['libelleStatutPersonnel']);
  }

  menaCentreTypeOptions() {
    return toMenaSelectOptionsFromPairs([
      { value: '', label: 'Tous les types' },
      { value: 'ALPHA', label: 'Centre Alpha' },
      { value: 'CEC', label: 'Centre CEC' },
      { value: 'CP', label: 'Centre CP' },
      { value: 'SIE', label: 'Centre SIE' },
    ]);
  }

  menaCentreOptions() {
    return toMenaSelectOptions(this.filteredCentres, (c) => c.id ?? null, (c) => this.centreLabel(c));
  }

  centreTypeDisplayLabel(type: string | undefined): string {
    const map: Record<string, string> = {
      ALPHA: 'Alpha',
      CEC: 'CEC',
      CP: 'CP',
      SIE: 'SIE',
      AUTRE: 'Autre',
    };
    return map[type ?? ''] ?? type ?? '—';
  }

  menaFonctionOptions() {
    return toMenaSelectOptions(this.fonctions, (f) => f.id, (f) => this.fonctionLabel(f));
  }

  menaCiviliteOptions() {
    return toMenaSelectOptions(this.civilites, (c) => c.id, (c) => this.civiliteLabel(c));
  }

  menaNiveauOptions() {
    return toMenaSelectOptions(this.niveaux, (n) => n.id, (n) => this.niveauLabel(n));
  }

  menaStatutOptions() {
    return toMenaSelectOptions(this.statuts, (s) => s.id, (s) => this.statutLabel(s));
  }

  menaDiplomeOptions() {
    return toMenaSelectOptions(this.diplomes, (d) => d.id, (d) => this.diplomeLabel(d));
  }

  menaStructureFormationOptions() {
    return toMenaSelectOptions(this.structuresFormation, (s) => s.id, (s) => this.structureFormationLabel(s));
  }

  diplomeLabel(d: Record<string, unknown>): string {
    return refEntityLabelForSelect(d, ['libelleDiplome']);
  }

  structureFormationLabel(s: Record<string, unknown>): string {
    return refEntityLabelForSelect(s, ['libelleStructureCertification']);
  }

  centreKindFromCode(code: string | null | undefined): 'ALPHA' | 'CEC' | 'CP' | 'SIE' | 'AUTRE' {
    const c = (code ?? '').toUpperCase();
    if (c.includes('ALP') || c.includes('ALPHA')) return 'ALPHA';
    if (c.includes('CEC')) return 'CEC';
    if (c.includes('SIE')) return 'SIE';
    if (c.includes('CP')) return 'CP';
    return 'AUTRE';
  }

  private formatError(e: unknown): string {
    const anyE = e as any;
    const msg =
      anyE?.error?.message ??
      anyE?.message ??
      'Erreur inattendue. Vérifiez la console et le backend.';
    return String(msg);
  }
}

