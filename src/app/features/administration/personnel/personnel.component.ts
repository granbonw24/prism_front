import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { PersonnelAdmin, PersonnelAdminDashboard } from '@models/administration';
import { AdministrationService, PersonnelListQuery } from '@services/administration.service';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';

@Component({
  selector: 'app-personnel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personnel.component.html',
  styleUrl: './personnel.component.css',
})
export class PersonnelComponent {
  centreId: number | null = null;

  dashboard: PersonnelAdminDashboard | null = null;
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

  centres: any[] = [];
  fonctions: any[] = [];
  civilites: any[] = [];
  niveaux: any[] = [];
  statuts: any[] = [];

  loading = false;
  saving = false;
  errorMessage: string | null = null;

  creating: any = {
    idCentreId: null,
    idFonctionId: null,
    idCiviliteId: null,
    idNiveauPersonnelId: null,
    idStatutPersonnelId: null,
    nomPersonnel: '',
    prenomsPersonnel: '',
    contactPersonnel: '',
    emailPersonnel: '',
    sexePersonnel: '',
  };

  editingId: number | null = null;
  edit: any = null;

  constructor(
    private readonly admin: AdministrationService,
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {
    this.loadRefs();
  }

  scrollToCreate(): void {
    const el = globalThis.document?.getElementById('createPersonnelCard');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  loadRefs(): void {
    this.loading = true;
    this.errorMessage = null;

    forkJoin({
      centres: this.http.get<any[]>(`${this.apiBaseUrl}/api/v1/centres`),
      fonctions: this.http.get<any[]>(`${this.apiBaseUrl}/api/v1/fonctions`),
      civilites: this.http.get<any[]>(`${this.apiBaseUrl}/api/civilite`),
      niveaux: this.http.get<any[]>(`${this.apiBaseUrl}/api/niveau-personnel`),
      statuts: this.http.get<any[]>(`${this.apiBaseUrl}/api/v1/StatutPersonnels`),
    }).subscribe({
      next: (res) => {
        this.centres = res.centres ?? [];
        this.fonctions = res.fonctions ?? [];
        this.civilites = res.civilites ?? [];
        this.niveaux = res.niveaux ?? [];
        this.statuts = res.statuts ?? [];
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  onCentreChange(): void {
    if (this.centreId == null) {
      this.rows = [];
      this.dashboard = null;
      this.pageIndex = 0;
      this.resetListFilters(false);
      return;
    }
    this.creating.idCentreId = this.centreId;
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
    this.loading = true;
    this.errorMessage = null;
    this.admin.listPersonnelByCentrePage(this.centreId, this.pageIndex, this.pageSize, this.buildListQuery()).subscribe({
      next: (page) => {
        this.rows = page.content ?? [];
        this.totalPages = page.totalPages ?? 0;
        this.totalElements = page.totalElements ?? 0;
        this.dashboard = {
          centreId: this.centreId!,
          total: page.totalElements ?? 0,
        };
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
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

  canCreate(): boolean {
    const r = this.creating;
    return (
      !this.saving &&
      r.idCentreId != null &&
      r.idFonctionId != null &&
      r.idCiviliteId != null &&
      r.idNiveauPersonnelId != null &&
      r.idStatutPersonnelId != null &&
      String(r.nomPersonnel ?? '').trim().length > 0 &&
      String(r.prenomsPersonnel ?? '').trim().length > 0
    );
  }

  create(): void {
    if (!this.canCreate()) return;
    this.saving = true;
    this.errorMessage = null;
    this.admin.createPersonnel(this.creating).subscribe({
      next: () => {
        this.saving = false;
        this.creating.nomPersonnel = '';
        this.creating.prenomsPersonnel = '';
        this.creating.contactPersonnel = '';
        this.creating.emailPersonnel = '';
        this.creating.sexePersonnel = '';
        this.reload();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  startEdit(row: PersonnelAdmin): void {
    if (this.saving) return;
    this.editingId = row.id;
    this.edit = { ...row };
    // API expects request field names like idCentreId
    this.edit.idCentreId = row.centreId;
    this.edit.idFonctionId = row.fonctionId;
    this.edit.idCiviliteId = row.civiliteId;
    this.edit.idNiveauPersonnelId = row.niveauPersonnelId;
    this.edit.idStatutPersonnelId = row.statutPersonnelId;
    this.edit.idStructureFormationCertificationId =
      row.structureFormationCertificationId;
  }

  cancelEdit(): void {
    if (this.saving) return;
    this.editingId = null;
    this.edit = null;
  }

  canSaveEdit(): boolean {
    if (this.saving || this.editingId == null || !this.edit) return false;
    const r = this.edit;
    return (
      r.idCentreId != null &&
      r.idFonctionId != null &&
      r.idCiviliteId != null &&
      r.idNiveauPersonnelId != null &&
      r.idStatutPersonnelId != null &&
      String(r.nomPersonnel ?? '').trim().length > 0 &&
      String(r.prenomsPersonnel ?? '').trim().length > 0
    );
  }

  saveEdit(): void {
    if (!this.canSaveEdit()) return;
    const id = this.editingId!;
    this.saving = true;
    this.errorMessage = null;
    this.admin.updatePersonnel(id, this.edit).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.reload();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
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

  private formatError(e: unknown): string {
    const anyE = e as any;
    const msg =
      anyE?.error?.message ??
      anyE?.message ??
      'Erreur inattendue. Vérifiez la console et le backend.';
    return String(msg);
  }
}

