import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { unwrapListBody } from '@core/http/unwrap-spring-page';
import { forkJoin } from 'rxjs';
import { PersonnelAdmin } from '@models/administration';
import { AdministrationService } from '@services/administration.service';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import {
  refEntityLabelForSelect,
  sortByLabel,
  toMenaSelectOptions,
  toMenaSelectOptionsFromPairs,
} from '@shared/mena-searchable-select/mena-select-options.util';
import { MenaToolbarButtonComponent } from '@shared/mena-toolbar-button/mena-toolbar-button.component';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';

type CentreTypeFilter = '' | 'ALPHA' | 'CEC' | 'CP' | 'SIE';

type PersonnelCentreOption = {
  id?: number;
  codeCentre?: string | null;
  libelle?: string | null;
  localisationCentre?: string | null;
  centreType?: 'ALPHA' | 'CEC' | 'CP' | 'SIE';
};

@Component({
  selector: 'app-personnel-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MenaSearchableSelectComponent,
    MenaToolbarButtonComponent,
    MenaLoadingComponent,
  ],
  templateUrl: './personnel-form.component.html',
  styleUrl: './personnel.component.css',
})
export class PersonnelFormComponent implements OnInit {
  mode: 'create' | 'edit' = 'create';
  personnelId: number | null = null;
  centreId: number | null = null;
  centreTypeFilter: CentreTypeFilter = '';

  form: any = this.emptyForm();
  fonctions: any[] = [];
  civilites: any[] = [];
  niveaux: any[] = [];
  statuts: any[] = [];
  diplomes: any[] = [];
  structuresFormation: any[] = [];
  centres: PersonnelCentreOption[] = [];

  refsLoading = false;
  centresLoading = false;
  saving = false;
  errorMessage: string | null = null;

  private readonly centreApiByType: Record<'ALPHA' | 'CEC' | 'CP' | 'SIE', string> = {
    ALPHA: '/api/alpha',
    CEC: '/api/cec',
    CP: '/api/cp',
    SIE: '/api/sie',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly admin: AdministrationService,
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] === 'edit' ? 'edit' : 'create';
    const idParam = this.route.snapshot.paramMap.get('id');
    this.personnelId = idParam != null && idParam !== '' ? Number(idParam) : null;
    const centreQ = this.route.snapshot.queryParamMap.get('centreId');
    const typeQ = this.route.snapshot.queryParamMap.get('centreType') as CentreTypeFilter | null;
    if (centreQ != null && centreQ !== '') {
      this.centreId = Number(centreQ);
    }
    if (typeQ && ['ALPHA', 'CEC', 'CP', 'SIE'].includes(typeQ)) {
      this.centreTypeFilter = typeQ;
    }
    this.loadRefs(() => {
      if (this.mode === 'edit') {
        this.initEditFromState();
      } else {
        this.form.idCentreId = this.centreId;
      }
    });
  }

  get loading(): boolean {
    return this.refsLoading || this.centresLoading;
  }

  get title(): string {
    return this.mode === 'edit' ? 'Modifier le personnel' : 'Créer un personnel';
  }

  get selectedCentreKind(): 'ALPHA' | 'CEC' | 'CP' | 'SIE' | 'AUTRE' {
    if (this.centreTypeFilter) return this.centreTypeFilter;
    const centre = this.centres.find((c) => c.id === this.form.idCentreId);
    if (centre?.centreType) return centre.centreType;
    return this.centreKindFromCode(centre?.codeCentre);
  }

  private initEditFromState(): void {
    const row = (history.state?.['row'] ?? null) as PersonnelAdmin | null;
    if (!row?.id) {
      this.errorMessage = 'Personnel introuvable. Revenez à la liste.';
      return;
    }
    this.personnelId = row.id;
    this.form = {
      idCentreId: row.centreId,
      idFonctionId: row.fonctionId,
      idCiviliteId: row.civiliteId,
      idNiveauPersonnelId: row.niveauPersonnelId,
      idStatutPersonnelId: row.statutPersonnelId,
      idDiplomeId: row.diplomeId,
      idStructureFormationCertificationId: row.structureFormationCertificationId,
      certifierPersonnel: row.certifierPersonnel,
      nomPersonnel: row.nomPersonnel ?? '',
      prenomsPersonnel: row.prenomsPersonnel ?? '',
      dateNaissance: row.dateNaissance ?? '',
      contactPersonnel: row.contactPersonnel ?? '',
      emailPersonnel: row.emailPersonnel ?? '',
      anneExpePersonnel: row.anneExpePersonnel,
      sexePersonnel: row.sexePersonnel ?? '',
      denominationPersonnel: row.denominationPersonnel ?? '',
      nomDuPrgramme: row.nomDuPrgramme ?? '',
      nomRepresentantLegalSturcture: row.nomRepresentantLegalSturcture ?? '',
    };
    this.centreId = row.centreId ?? null;
  }

  loadRefs(after?: () => void): void {
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
        this.loadCentresForType(after);
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.refsLoading = false;
      },
    });
  }

  loadCentresForType(after?: () => void): void {
    const types: Array<'ALPHA' | 'CEC' | 'CP' | 'SIE'> = this.centreTypeFilter
      ? [this.centreTypeFilter]
      : ['ALPHA', 'CEC', 'CP', 'SIE'];
    this.centresLoading = true;
    const params = new HttpParams({ fromObject: { page: '0', size: '2000', sort: 'id,asc' } });
    forkJoin(
      types.map((type) =>
        this.http.get<unknown>(`${this.apiBaseUrl}${this.centreApiByType[type]}`, { params }),
      ),
    ).subscribe({
      next: (bodies) => {
        const merged: PersonnelCentreOption[] = [];
        types.forEach((type, index) => {
          const rows = unwrapListBody(bodies[index]) as Record<string, unknown>[];
          for (const row of rows) merged.push(this.mapTypedCentreRow(row, type));
        });
        this.centres = sortByLabel(merged, (c) => this.centreLabel(c));
        this.centresLoading = false;
        after?.();
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

  canSave(): boolean {
    const r = this.form;
    const certified = r.certifierPersonnel === true;
    const base =
      !this.saving &&
      !this.refsLoading &&
      r.idCentreId != null &&
      r.idFonctionId != null &&
      r.idCiviliteId != null &&
      r.idNiveauPersonnelId != null &&
      r.idStatutPersonnelId != null &&
      String(r.nomPersonnel ?? '').trim().length > 0 &&
      String(r.prenomsPersonnel ?? '').trim().length > 0;
    if (this.mode === 'create') {
      return (
        base &&
        r.idDiplomeId != null &&
        String(r.contactPersonnel ?? '').trim().length > 0 &&
        (!certified || r.idStructureFormationCertificationId != null)
      );
    }
    return base && r.idDiplomeId != null;
  }

  save(): void {
    if (!this.canSave()) return;
    this.saving = true;
    this.errorMessage = null;
    const req =
      this.mode === 'edit' && this.personnelId != null
        ? this.admin.updatePersonnel(this.personnelId, this.form)
        : this.admin.createPersonnel(this.form);
    req.subscribe({
      next: () => {
        this.saving = false;
        void this.router.navigate(['/personnel'], {
          queryParams: {
            centreId: this.form.idCentreId ?? undefined,
            centreType: this.centreTypeFilter || undefined,
          },
        });
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  cancel(): void {
    void this.router.navigate(['/personnel'], {
      queryParams: {
        centreId: this.form.idCentreId ?? this.centreId ?? undefined,
        centreType: this.centreTypeFilter || undefined,
      },
    });
  }

  menaCentreOptions() {
    return toMenaSelectOptions(this.centres, (c) => c.id ?? null, (c) => this.centreLabel(c));
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

  menaCentreTypeOptions() {
    return toMenaSelectOptionsFromPairs([
      { value: '', label: 'Tous les types' },
      { value: 'ALPHA', label: 'Centre Alpha' },
      { value: 'CEC', label: 'Centre CEC' },
      { value: 'CP', label: 'Centre CP' },
      { value: 'SIE', label: 'Centre SIE' },
    ]);
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

  diplomeLabel(d: Record<string, unknown>): string {
    return refEntityLabelForSelect(d, ['libelleDiplome']);
  }

  structureFormationLabel(s: Record<string, unknown>): string {
    return refEntityLabelForSelect(s, ['libelleStructureCertification']);
  }

  showDenominationField(): boolean {
    return this.selectedCentreKind === 'CEC' || this.selectedCentreKind === 'AUTRE';
  }

  showProgrammeField(): boolean {
    return this.selectedCentreKind === 'CP';
  }

  showRepresentantLegalField(): boolean {
    return this.selectedCentreKind === 'SIE';
  }

  onCertificationChange(value: boolean | string | null): void {
    const certified = value === true || value === 'true';
    this.form.certifierPersonnel = certified;
    if (!certified) this.form.idStructureFormationCertificationId = null;
  }

  onCentreTypeChange(): void {
    this.loadCentresForType();
  }

  centreKindFromCode(code: string | null | undefined): 'ALPHA' | 'CEC' | 'CP' | 'SIE' | 'AUTRE' {
    const c = (code ?? '').toUpperCase();
    if (c.includes('ALP') || c.includes('ALPHA')) return 'ALPHA';
    if (c.includes('CEC')) return 'CEC';
    if (c.includes('SIE')) return 'SIE';
    if (c.includes('CP')) return 'CP';
    return 'AUTRE';
  }

  private emptyForm(): any {
    return {
      idCentreId: null,
      idFonctionId: null,
      idCiviliteId: null,
      idNiveauPersonnelId: null,
      idStatutPersonnelId: null,
      idDiplomeId: null,
      idStructureFormationCertificationId: null,
      certifierPersonnel: null,
      nomPersonnel: '',
      prenomsPersonnel: '',
      dateNaissance: '',
      contactPersonnel: '',
      emailPersonnel: '',
      anneExpePersonnel: null,
      sexePersonnel: '',
      denominationPersonnel: '',
      nomDuPrgramme: '',
      nomRepresentantLegalSturcture: '',
    };
  }

  private formatError(e: unknown): string {
    const anyE = e as any;
    return String(anyE?.error?.message ?? anyE?.message ?? 'Erreur inattendue.');
  }
}
