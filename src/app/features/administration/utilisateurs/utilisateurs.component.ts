import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AdminReference,
  AdminScopeOption,
  AppRole,
  AppUserAdmin,
  AppUserAdminUpsertRequest,
} from '@models/administration';
import { AdministrationService } from '@services/administration.service';

type ScopeKey =
  | 'idRegion'
  | 'idDrena'
  | 'idIep'
  | 'idDepartement'
  | 'idSousPrefecture'
  | 'idCommune'
  | 'idLocalite';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utilisateurs.component.html',
  styleUrl: './utilisateurs.component.css',
})
export class UtilisateursComponent implements OnInit {
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  roles: AppRole[] = [];
  users: AppUserAdmin[] = [];
  regions: AdminScopeOption[] = [];
  drenas: AdminScopeOption[] = [];
  ieps: AdminScopeOption[] = [];
  departements: AdminScopeOption[] = [];
  sousPrefectures: AdminScopeOption[] = [];
  communes: AdminScopeOption[] = [];
  localites: AdminScopeOption[] = [];

  readonly scopeConfigs: Array<{
    key: ScopeKey;
    label: string;
    options: () => AdminScopeOption[];
  }> = [
    { key: 'idRegion', label: 'Région', options: () => this.regions },
    { key: 'idDrena', label: 'DRENA', options: () => this.drenas },
    { key: 'idIep', label: 'IEPP', options: () => this.ieps },
    { key: 'idDepartement', label: 'Département', options: () => this.departements },
    { key: 'idSousPrefecture', label: 'Sous-préfecture', options: () => this.sousPrefectures },
    { key: 'idCommune', label: 'Commune', options: () => this.communes },
    { key: 'idLocalite', label: 'Localité', options: () => this.localites },
  ];

  pageIndex = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  detailsUser: AppUserAdmin | null = null;
  editUserId: number | null = null;
  createOpen = false;
  createForm: AppUserAdminUpsertRequest = {
    username: '',
    email: '',
    actif: true,
    password: '',
    roleIds: [],
    idRegion: null,
    idDrena: null,
    idIep: null,
    idDepartement: null,
    idSousPrefecture: null,
    idCommune: null,
    idLocalite: null,
  };
  editForm: AppUserAdminUpsertRequest = {
    username: '',
    email: '',
    actif: true,
    password: '',
    roleIds: [],
    idRegion: null,
    idDrena: null,
    idIep: null,
    idDepartement: null,
    idSousPrefecture: null,
    idCommune: null,
    idLocalite: null,
  };

  roleFilterCreate = '';
  roleFilterEdit = '';
  createSelectedRoleId: number | null = null;
  editSelectedRoleId: number | null = null;

  constructor(private readonly admin: AdministrationService) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;
    try {
      await Promise.all([this.loadRoles(), this.loadScopeOptions()]);
      await this.loadUsersPage();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.loading = false;
    }
  }

  private async loadRoles(): Promise<void> {
    this.roles = await firstValueFrom(this.admin.getRoles());
  }

  private async loadScopeOptions(): Promise<void> {
    const [regions, drenas, ieps, departements, sousPrefectures, communes, localites] =
      await Promise.all([
        firstValueFrom(this.admin.getScopeOptions('/api/region')),
        firstValueFrom(this.admin.getScopeOptions('/api/drena')),
        firstValueFrom(this.admin.getScopeOptions('/api/iep')),
        firstValueFrom(this.admin.getScopeOptions('/api/departement')),
        firstValueFrom(this.admin.getScopeOptions('/api/sous-prefecture')),
        firstValueFrom(this.admin.getScopeOptions('/api/commune')),
        firstValueFrom(this.admin.getScopeOptions('/api/localite-d-implantation')),
      ]);
    this.regions = regions;
    this.drenas = drenas;
    this.ieps = ieps;
    this.departements = departements;
    this.sousPrefectures = sousPrefectures;
    this.communes = communes;
    this.localites = localites;
  }

  private async loadUsersPage(): Promise<void> {
    const page = await firstValueFrom(this.admin.getUsersPage(this.pageIndex, this.pageSize));
    this.users = page.content ?? [];
    this.totalPages = page.totalPages ?? 0;
    this.totalElements = page.totalElements ?? 0;
  }

  async goPrevPage(): Promise<void> {
    if (!this.canGoPrevPage()) return;
    this.pageIndex--;
    this.loading = true;
    this.errorMessage = null;
    try {
      await this.loadUsersPage();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.loading = false;
    }
  }

  async goNextPage(): Promise<void> {
    if (!this.canGoNextPage()) return;
    this.pageIndex++;
    this.loading = true;
    this.errorMessage = null;
    try {
      await this.loadUsersPage();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.loading = false;
    }
  }

  async onPageSizeChange(): Promise<void> {
    this.pageIndex = 0;
    this.loading = true;
    this.errorMessage = null;
    try {
      await this.loadUsersPage();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.loading = false;
    }
  }

  canGoPrevPage(): boolean {
    return this.pageIndex > 0 && !this.loading;
  }

  canGoNextPage(): boolean {
    const tp = this.totalPages;
    if (tp <= 0) return false;
    return this.pageIndex < tp - 1 && !this.loading;
  }

  get displayTotalPages(): number {
    return this.totalPages > 0 ? this.totalPages : 1;
  }

  openCreate(): void {
    this.createOpen = true;
    this.roleFilterCreate = '';
    this.createForm = {
      username: '',
      email: '',
      actif: true,
      password: '',
      roleIds: [],
      idRegion: null,
      idDrena: null,
      idIep: null,
      idDepartement: null,
      idSousPrefecture: null,
      idCommune: null,
      idLocalite: null,
    };
    this.createSelectedRoleId = null;
  }

  closeCreate(): void {
    this.createOpen = false;
  }

  canCreate(): boolean {
    return (
      !this.saving &&
      String(this.createForm.username ?? '').trim().length > 0 &&
      String(this.createForm.password ?? '').trim().length > 0 &&
      this.scopeIsValid(this.createSelectedRoleId, this.createForm)
    );
  }

  async createUser(): Promise<void> {
    if (!this.canCreate()) return;
    this.saving = true;
    this.errorMessage = null;
    try {
      await firstValueFrom(
        this.admin.createUser({
          username: String(this.createForm.username ?? '').trim(),
          email: String(this.createForm.email ?? '').trim() || null,
          actif: !!this.createForm.actif,
          password: String(this.createForm.password ?? ''),
          roleIds: this.createSelectedRoleId != null ? [this.createSelectedRoleId] : [],
          ...this.scopePayload(this.createForm),
        }),
      );
      this.closeCreate();
      this.pageIndex = 0;
      await this.reload();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.saving = false;
    }
  }

  openDetails(u: AppUserAdmin): void {
    this.detailsUser = u;
  }

  closeDetails(): void {
    this.detailsUser = null;
  }

  openEdit(u: AppUserAdmin): void {
    this.editUserId = u.id;
    this.roleFilterEdit = '';
    this.editForm = {
      username: u.username,
      email: u.email ?? '',
      actif: !!u.actif,
      password: '',
      roleIds: [...(u.roleIds ?? [])],
      idRegion: u.idRegion ?? null,
      idDrena: u.idDrena ?? null,
      idIep: u.idIep ?? null,
      idDepartement: u.idDepartement ?? null,
      idSousPrefecture: u.idSousPrefecture ?? null,
      idCommune: u.idCommune ?? null,
      idLocalite: u.idLocalite ?? null,
    };
    this.editSelectedRoleId = (u.roleIds ?? [])[0] ?? null;
  }

  closeEdit(): void {
    this.editUserId = null;
  }

  canSaveEdit(): boolean {
    return (
      !this.saving &&
      this.editUserId != null &&
      String(this.editForm.username ?? '').trim().length > 0 &&
      this.scopeIsValid(this.editSelectedRoleId, this.editForm)
    );
  }

  async saveEdit(): Promise<void> {
    if (!this.canSaveEdit()) return;
    const id = this.editUserId!;
    this.saving = true;
    this.errorMessage = null;
    try {
      await firstValueFrom(
        this.admin.updateUser(id, {
          username: String(this.editForm.username ?? '').trim(),
          email: String(this.editForm.email ?? '').trim() || null,
          actif: !!this.editForm.actif,
          password: String(this.editForm.password ?? '').trim() || null,
          roleIds: this.editSelectedRoleId != null ? [this.editSelectedRoleId] : [],
          ...this.scopePayload(this.editForm),
        }),
      );
      this.closeEdit();
      await this.reload();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.saving = false;
    }
  }

  async deleteUser(u: AppUserAdmin): Promise<void> {
    if (this.saving) return;
    if (!confirm(`Supprimer l'utilisateur "${u.username}" ?`)) return;
    this.saving = true;
    this.errorMessage = null;
    try {
      await firstValueFrom(this.admin.deleteUser(u.id));
      await this.reload();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.saving = false;
    }
  }

  roleLabel(roleId: number): string {
    const r = this.roles.find((x) => x.id === roleId);
    return String(r?.libelleRole ?? r?.codeRole ?? roleId);
  }

  roleCode(roleId: number | null): string {
    if (roleId == null) return '';
    const role = this.roles.find((x) => x.id === roleId);
    return String(role?.codeRole ?? '').trim().toUpperCase();
  }

  requiresScope(roleId: number | null): boolean {
    return ['CONSEILLER', 'COORDONNATEUR', 'SUPERVISEUR', 'IEPP'].includes(this.roleCode(roleId));
  }

  isIeppRole(roleId: number | null): boolean {
    return this.roleCode(roleId) === 'IEPP';
  }

  scopeIsValid(roleId: number | null, form: AppUserAdminUpsertRequest): boolean {
    if (!this.requiresScope(roleId)) {
      return true;
    }
    if (this.isIeppRole(roleId)) {
      return form.idIep != null;
    }
    return this.scopeConfigs.some((scope) => form[scope.key] != null);
  }

  scopeValidationMessage(roleId: number | null): string {
    if (this.isIeppRole(roleId)) {
      return 'Le rôle IEPP doit être rattaché à une IEPP.';
    }
    return 'Sélectionner au moins une circonscription pour ce rôle.';
  }

  scopeLabel(ref?: AdminReference | null): string {
    if (!ref) return '—';
    return [ref.code, ref.libelle].filter((v) => v != null && String(v).trim()).join(' — ') || String(ref.id ?? '—');
  }

  userScopeSummary(user: AppUserAdmin): string {
    const labels = [
      user.region ? `Région: ${this.scopeLabel(user.region)}` : '',
      user.drena ? `DRENA: ${this.scopeLabel(user.drena)}` : '',
      user.iep ? `IEPP: ${this.scopeLabel(user.iep)}` : '',
      user.departement ? `Département: ${this.scopeLabel(user.departement)}` : '',
      user.sousPrefecture ? `Sous-préfecture: ${this.scopeLabel(user.sousPrefecture)}` : '',
      user.commune ? `Commune: ${this.scopeLabel(user.commune)}` : '',
      user.localite ? `Localité: ${this.scopeLabel(user.localite)}` : '',
    ].filter(Boolean);
    return labels.length ? labels.join(' | ') : '—';
  }

  optionLabel(option: AdminScopeOption): string {
    return [option.code, option.libelle].filter((v) => v != null && String(v).trim()).join(' — ') || String(option.id);
  }

  filteredRoles(q: string): AppRole[] {
    const s = String(q ?? '').trim().toLowerCase();
    if (!s) return this.roles;
    return this.roles.filter((r) =>
      `${r.libelleRole ?? ''} ${r.codeRole ?? ''} ${r.id}`.toLowerCase().includes(s),
    );
  }

  trackRoleById(_idx: number, r: AppRole): number {
    return r.id;
  }

  trackScopeById(_idx: number, option: AdminScopeOption): number {
    return option.id;
  }

  private scopePayload(form: AppUserAdminUpsertRequest): Pick<
    AppUserAdminUpsertRequest,
    ScopeKey
  > {
    return {
      idRegion: form.idRegion ?? null,
      idDrena: form.idDrena ?? null,
      idIep: form.idIep ?? null,
      idDepartement: form.idDepartement ?? null,
      idSousPrefecture: form.idSousPrefecture ?? null,
      idCommune: form.idCommune ?? null,
      idLocalite: form.idLocalite ?? null,
    };
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const msg = String((e.error as any)?.message ?? '');
      return msg ? `Erreur serveur: ${e.status} ${e.statusText} — ${msg}` : `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}

