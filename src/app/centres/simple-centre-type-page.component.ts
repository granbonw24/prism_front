import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';

type Row = {
  idCentre: number;
  codeCentre?: string | null;
  libelle?: string | null;
  idLocalite?: number | null;
  idIep?: number | null;
  idNaturecentre?: number | null;
  idPeriodicite?: number | null;
  idAutoriteAutorisation?: number | null;
  autorisation?: boolean | null;
  estElectrifie?: boolean | null;
  aDeLeau?: boolean | null;
  nombreVisite?: number | null;
  localisationCentre?: string | null;
  nomMilieuImplentation?: string | null;
};
type LocaliteOption = { id: number; codeLocalite?: string | null; nomLocalite?: string | null };
type IepOption = { id: number; codeIep?: string | null; nomIep?: string | null };
type NatureOption = { id: number; codeNatureCentre?: string | null; libelleNatureCentre?: string | null };
type PeriodiciteOption = { id: number; codePeriodicite?: string | null; libellePeriodicite?: string | null };
type AutoriteOption = {
  id: number;
  codeAutorisation?: string | null;
  libelleAutoriteAutorisation?: string | null;
};

type SimpleFullCreatePayload = {
  libelle: string;
  promoteur: { libellePromoteur: string };
  centre: {
    localiteId: number;
    periodiciteId?: number | null;
    iepId: number;
    autoriteAutorisationId?: number | null;
    natureCentreId: number;
    autorisation?: boolean | null;
    encadreurNonMena?: string | null;
    encadrerParMena?: boolean | null;
    estElectrifie?: boolean | null;
    aDeLeau?: boolean | null;
    nombreVisite?: number | null;
    localisationCentre?: string | null;
    nomMilieuImplentation?: string | null;
  };
};

@Component({
  selector: 'app-simple-centre-type-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simple-centre-type-page.component.html',
})
export class SimpleCentreTypePageComponent {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) apiPath!: string;

  loading = false;
  saving = false;
  errorMessage: string | null = null;

  rows: Row[] = [];
  localites: LocaliteOption[] = [];
  ieps: IepOption[] = [];
  natures: NatureOption[] = [];
  periodicites: PeriodiciteOption[] = [];
  autorites: AutoriteOption[] = [];

  stepIndex = 0;

  model: SimpleFullCreatePayload = {
    libelle: '',
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
  detailsRow: Row | null = null;
  editRowId: number | null = null;
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
      rows: this.http.get<any[]>(`${this.apiBaseUrl}${this.apiPath}`),
      localites: this.http.get<LocaliteOption[]>(`${this.apiBaseUrl}/api/localite-d-implantation`),
      ieps: this.http.get<IepOption[]>(`${this.apiBaseUrl}/api/iep`),
      natures: this.http.get<NatureOption[]>(`${this.apiBaseUrl}/api/naturecentre`),
      periodicites: this.http.get<PeriodiciteOption[]>(`${this.apiBaseUrl}/api/v1/Periodicites`),
      autorites: this.http.get<AutoriteOption[]>(`${this.apiBaseUrl}/api/autoriteautorisation`),
    }).subscribe({
      next: (res) => {
        this.rows = (res.rows ?? []).map((x) => ({
          idCentre: x.idCentre ?? x.id,
          codeCentre: x.codeCentre,
          libelle: x.libelle,
          idLocalite: x.idLocalite ?? null,
          idIep: x.idIep ?? null,
          idNaturecentre: x.idNaturecentre ?? null,
          idPeriodicite: x.idPeriodicite ?? null,
          idAutoriteAutorisation: x.idAutoriteAutorisation ?? null,
          autorisation: x.autorisation ?? null,
          estElectrifie: x.estElectrifie ?? null,
          aDeLeau: x.aDeLeau ?? null,
          nombreVisite: x.nombreVisite ?? null,
          localisationCentre: x.localisationCentre ?? null,
          nomMilieuImplentation: x.nomMilieuImplentation ?? null,
        }));
        this.localites = res.localites ?? [];
        this.ieps = res.ieps ?? [];
        this.natures = res.natures ?? [];
        this.periodicites = res.periodicites ?? [];
        this.autorites = res.autorites ?? [];
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
      return String(this.model.promoteur.libellePromoteur ?? '').trim().length > 0;
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
    this.detailsRow = row;
  }

  closeDetails(): void {
    this.detailsRow = null;
  }

  openEdit(row: Row): void {
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
    const payload: SimpleFullCreatePayload = {
      libelle: String(this.model.libelle ?? '').trim(),
      promoteur: { libellePromoteur: String(this.model.promoteur.libellePromoteur ?? '').trim() },
      centre: { ...this.model.centre },
    };
    this.http.post(`${this.apiBaseUrl}${this.apiPath}/full`, payload).subscribe({
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

  private formatError(e: unknown): string {
    const anyE = e as any;
    return String(
      anyE?.error?.message ??
        anyE?.message ??
        'Erreur inattendue. Vérifiez la console et le backend.',
    );
  }
}

