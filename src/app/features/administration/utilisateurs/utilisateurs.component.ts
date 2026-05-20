import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { MENU_FEATURES } from '@core/config/menu-rbac.config';
import { canViewMenuFeature } from '@core/rbac/menu-rbac.util';
import { AdministrationService, type AppUsersListQuery } from '@services/administration.service';
import { AuthService } from '@services/auth.service';
import { MenaPasswordFieldComponent } from '@shared/mena-password-field/mena-password-field.component';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import { MenaContextDashboardComponent } from '@shared/mena-context-dashboard/mena-context-dashboard.component';
import { MenaLoadingComponent } from '@shared/mena-loading/mena-loading.component';
import {
  MenaSelectOption,
  sortByLabel,
  toMenaSelectOptions,
} from '@shared/mena-searchable-select/mena-select-options.util';

type ScopeKey =
  | 'idRegion'
  | 'idDrena'
  | 'idIep'
  | 'idDepartement'
  | 'idSousPrefecture'
  | 'idCommune'
  | 'idLocalite';

const SCOPE_DESCENDANTS: Record<ScopeKey, ScopeKey[]> = {
  idRegion: ['idDepartement', 'idDrena', 'idIep', 'idSousPrefecture', 'idCommune', 'idLocalite'],
  idDepartement: ['idDrena', 'idIep', 'idSousPrefecture', 'idCommune', 'idLocalite'],
  idDrena: ['idIep'],
  idIep: [],
  idSousPrefecture: ['idCommune', 'idLocalite'],
  idCommune: ['idLocalite'],
  idLocalite: [],
};

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MenaPasswordFieldComponent,
    MenaSearchableSelectComponent,
    MenaContextDashboardComponent,
    MenaLoadingComponent,
  ],
  templateUrl: './utilisateurs.component.html',
  styleUrl: './utilisateurs.component.css',
})
export class UtilisateursComponent implements OnInit, OnDestroy {
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  roles: AppRole[] = [];
  roleSelectOptions: MenaSelectOption[] = [];
  users: AppUserAdmin[] = [];
  regions: AdminScopeOption[] = [];
  drenas: AdminScopeOption[] = [];
  ieps: AdminScopeOption[] = [];
  departements: AdminScopeOption[] = [];
  drenaDepartements: AdminScopeOption[] = [];
  sousPrefectures: AdminScopeOption[] = [];
  communes: AdminScopeOption[] = [];
  localites: AdminScopeOption[] = [];

  readonly scopeConfigs: Array<{
    key: ScopeKey;
    label: string;
  }> = [
    { key: 'idRegion', label: 'Région' },
    { key: 'idDepartement', label: 'Département' },
    { key: 'idDrena', label: 'DRENA' },
    { key: 'idIep', label: 'IEPP' },
    { key: 'idSousPrefecture', label: 'Sous-préfecture' },
    { key: 'idCommune', label: 'Commune' },
    { key: 'idLocalite', label: 'Localité' },
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

  createSelectedRoleId: number | null = null;
  editSelectedRoleId: number | null = null;

  /** Recherche / filtres liste (requête serveur paginée). */
  listSearchText = '';
  listFilterRoleId: number | null = null;
  listFilterActif: 'all' | 'yes' | 'no' = 'all';
  private listSearchDebounceHandle: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly admin: AdministrationService,
    private readonly auth: AuthService,
  ) {}

  get canCreate(): boolean {
    return canViewMenuFeature(this.auth, MENU_FEATURES.ADMIN_UTILISATEURS, 'CREER');
  }

  get canModify(): boolean {
    return canViewMenuFeature(this.auth, MENU_FEATURES.ADMIN_UTILISATEURS, 'MODIFIER');
  }

  get canDelete(): boolean {
    return canViewMenuFeature(this.auth, MENU_FEATURES.ADMIN_UTILISATEURS, 'SUPPRIMER');
  }

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  ngOnDestroy(): void {
    if (this.listSearchDebounceHandle != null) {
      clearTimeout(this.listSearchDebounceHandle);
      this.listSearchDebounceHandle = null;
    }
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
    const roles = await firstValueFrom(this.admin.getRoles());
    this.roles = sortByLabel(roles, (role) => role.libelleRole ?? role.codeRole ?? String(role.id));
    this.roleSelectOptions = toMenaSelectOptions(
      this.roles,
      (role) => role.id,
      (role) => role.libelleRole?.trim() || `#${role.id}`,
    );
  }

  private async loadScopeOptions(): Promise<void> {
    const [regions, drenas, ieps, departements, drenaDepartements, sousPrefectures, communes, localites] =
      await Promise.all([
        firstValueFrom(this.admin.getScopeOptions('/api/region')),
        firstValueFrom(this.admin.getScopeOptions('/api/drena')),
        firstValueFrom(this.admin.getScopeOptions('/api/iep')),
        firstValueFrom(this.admin.getScopeOptions('/api/departement')),
        firstValueFrom(this.admin.getScopeOptions('/api/drena-departement')),
        firstValueFrom(this.admin.getScopeOptions('/api/sous-prefecture')),
        firstValueFrom(this.admin.getScopeOptions('/api/commune')),
        firstValueFrom(this.admin.getScopeOptions('/api/localite-d-implantation')),
      ]);
    this.regions = sortByLabel(regions, (option) => this.optionLabel(option));
    this.drenas = sortByLabel(drenas, (option) => this.optionLabel(option));
    this.ieps = sortByLabel(ieps, (option) => this.optionLabel(option));
    this.departements = sortByLabel(departements, (option) => this.optionLabel(option));
    this.drenaDepartements = drenaDepartements;
    this.sousPrefectures = sortByLabel(sousPrefectures, (option) => this.optionLabel(option));
    this.communes = sortByLabel(communes, (option) => this.optionLabel(option));
    this.localites = sortByLabel(localites, (option) => this.optionLabel(option));
  }

  private listUsersQuery(): AppUsersListQuery {
    const q = this.listSearchText.trim();
    const actif =
      this.listFilterActif === 'yes' ? true : this.listFilterActif === 'no' ? false : undefined;
    return {
      ...(q ? { q } : {}),
      ...(this.listFilterRoleId != null ? { roleId: this.listFilterRoleId } : {}),
      ...(actif !== undefined ? { actif } : {}),
    };
  }

  get hasActiveListFilters(): boolean {
    return (
      this.listSearchText.trim() !== '' ||
      this.listFilterRoleId != null ||
      this.listFilterActif !== 'all'
    );
  }

  onListSearchChange(): void {
    if (this.listSearchDebounceHandle != null) {
      clearTimeout(this.listSearchDebounceHandle);
    }
    this.listSearchDebounceHandle = setTimeout(() => {
      this.listSearchDebounceHandle = null;
      void this.applyListFilters();
    }, 400);
  }

  applyListFilters(): void {
    void this.runListFilters();
  }

  private async runListFilters(): Promise<void> {
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

  clearListFilters(): void {
    this.listSearchText = '';
    this.listFilterRoleId = null;
    this.listFilterActif = 'all';
    if (this.listSearchDebounceHandle != null) {
      clearTimeout(this.listSearchDebounceHandle);
      this.listSearchDebounceHandle = null;
    }
    this.applyListFilters();
  }

  private async loadUsersPage(): Promise<void> {
    const page = await firstValueFrom(
      this.admin.getUsersPage(this.pageIndex, this.pageSize, this.listUsersQuery()),
    );
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
    if (!this.canCreate) return;
    this.createOpen = true;
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

  createFormIsValid(): boolean {
    return (
      !this.saving &&
      String(this.createForm.username ?? '').trim().length > 0 &&
      String(this.createForm.password ?? '').trim().length > 0 &&
      this.scopeSelectionsAreConsistent(this.createForm) &&
      this.scopeIsValid(this.createSelectedRoleId, this.createForm)
    );
  }

  async createUser(): Promise<void> {
    if (!this.canCreate || !this.createFormIsValid()) return;
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
    if (!this.canModify) return;
    this.editUserId = u.id;
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
      this.scopeSelectionsAreConsistent(this.editForm) &&
      this.scopeIsValid(this.editSelectedRoleId, this.editForm)
    );
  }

  async saveEdit(): Promise<void> {
    if (!this.canModify || !this.canSaveEdit()) return;
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
    if (!this.canDelete || this.saving) return;
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
      user.departement ? `Département: ${this.scopeLabel(user.departement)}` : '',
      user.drena ? `DRENA: ${this.scopeLabel(user.drena)}` : '',
      user.iep ? `IEPP: ${this.scopeLabel(user.iep)}` : '',
      user.sousPrefecture ? `Sous-préfecture: ${this.scopeLabel(user.sousPrefecture)}` : '',
      user.commune ? `Commune: ${this.scopeLabel(user.commune)}` : '',
      user.localite ? `Localité: ${this.scopeLabel(user.localite)}` : '',
    ].filter(Boolean);
    return labels.length ? labels.join(' | ') : '—';
  }

  optionLabel(option: AdminScopeOption): string {
    return [option.code, option.libelle].filter((v) => v != null && String(v).trim()).join(' — ') || String(option.id);
  }

  filteredScopeOptions(
    key: ScopeKey,
    form: AppUserAdminUpsertRequest,
  ): AdminScopeOption[] {
    const optionsByScope: Record<ScopeKey, () => AdminScopeOption[]> = {
      idRegion: () => this.regions,
      idDrena: () => this.filteredDrenas(form),
      idIep: () => this.filteredIeps(form),
      idDepartement: () => this.filteredDepartements(form),
      idSousPrefecture: () => this.filteredSousPrefectures(form),
      idCommune: () => this.filteredCommunes(form),
      idLocalite: () => this.filteredLocalites(form),
    };
    return sortByLabel(optionsByScope[key](), (option) => this.optionLabel(option));
  }

  menaScopeOptions(key: ScopeKey, form: AppUserAdminUpsertRequest) {
    return toMenaSelectOptions(
      this.filteredScopeOptions(key, form),
      (option) => option.id,
      (option) => this.optionSelectLabel(option),
    );
  }

  /** Libellé pour les listes déroulantes de circonscription (sans code). */
  optionSelectLabel(option: AdminScopeOption): string {
    return option.libelle?.trim() || `#${option.id}`;
  }

  onScopeChanged(
    form: AppUserAdminUpsertRequest,
    key: ScopeKey,
    value: number | null,
  ): void {
    form[key] = value;
    for (const descendantKey of SCOPE_DESCENDANTS[key]) {
      const currentValue = form[descendantKey];
      if (currentValue == null) {
        continue;
      }
      const stillAvailable = this.filteredScopeOptions(descendantKey, form).some(
        (option) => option.id === currentValue,
      );
      if (!stillAvailable) {
        form[descendantKey] = null;
      }
    }
  }

  trackRoleById(_idx: number, r: AppRole): number {
    return r.id;
  }

  trackUserById(_idx: number, u: AppUserAdmin): number {
    return u.id;
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

  private filteredIeps(form: AppUserAdminUpsertRequest): AdminScopeOption[] {
    if (form.idDrena == null) {
      const drenaIds = this.allowedDrenaIds(form.idRegion ?? null);
      if (drenaIds == null) {
        return this.ieps;
      }
      return this.ieps.filter((option) => {
        const drenaId = this.refId(option, 'drena');
        return drenaId != null && drenaIds.has(drenaId);
      });
    }
    return this.ieps.filter((option) => this.refId(option, 'drena') === form.idDrena);
  }

  private filteredDrenas(form: AppUserAdminUpsertRequest): AdminScopeOption[] {
    let options = this.drenas;
    const drenaIds = this.allowedDrenaIds(form.idRegion ?? null);
    if (drenaIds != null) {
      options = options.filter((option) => drenaIds.has(option.id));
    }
    if (form.idDepartement != null) {
      const drenaIdsForDept = new Set(
        this.drenaDepartements
          .filter((link) => this.refId(link, 'departement') === form.idDepartement)
          .map((link) => this.refId(link, 'drena'))
          .filter((id): id is number => id != null),
      );
      options = options.filter((option) => drenaIdsForDept.has(option.id));
    }
    return options;
  }

  private filteredDepartements(form: AppUserAdminUpsertRequest): AdminScopeOption[] {
    const allowedIds = this.allowedDepartementIds(form);
    if (allowedIds == null) {
      return this.departements;
    }
    return this.departements.filter((option) => allowedIds.has(option.id));
  }

  private filteredSousPrefectures(form: AppUserAdminUpsertRequest): AdminScopeOption[] {
    const allowedIds = this.allowedSousPrefectureIds(form);
    if (allowedIds == null) {
      return this.sousPrefectures;
    }
    return this.sousPrefectures.filter((option) => allowedIds.has(option.id));
  }

  private filteredCommunes(form: AppUserAdminUpsertRequest): AdminScopeOption[] {
    if (!this.hasUpperLocaliteFilter(form)) {
      return this.communes;
    }
    const communeIds = new Set(
      this.localitesMatchingUpperScope(form)
        .map((option) => this.refId(option, 'commune'))
        .filter((id): id is number => id != null),
    );
    return this.communes.filter((option) => communeIds.has(option.id));
  }

  private filteredLocalites(form: AppUserAdminUpsertRequest): AdminScopeOption[] {
    return this.localitesMatchingUpperScope(form);
  }

  private localitesMatchingUpperScope(form: AppUserAdminUpsertRequest): AdminScopeOption[] {
    const allowedSousPrefectureIds =
      form.idSousPrefecture != null ? new Set([form.idSousPrefecture]) : this.allowedSousPrefectureIds(form);
    return this.localites.filter((option) => {
      const sousPrefectureId = this.refId(option, 'sousPrefecture');
      const communeId = this.refId(option, 'commune');
      const sousPrefectureMatches =
        allowedSousPrefectureIds == null ||
        (sousPrefectureId != null && allowedSousPrefectureIds.has(sousPrefectureId));
      const communeMatches = form.idCommune == null || communeId === form.idCommune;
      return sousPrefectureMatches && communeMatches;
    });
  }

  private allowedDepartementIds(form: AppUserAdminUpsertRequest): Set<number> | null {
    const sets: Array<Set<number>> = [];
    if (form.idRegion != null) {
      sets.push(
        new Set(
          this.departements
            .filter((option) => this.refId(option, 'region') === form.idRegion)
            .map((option) => option.id),
        ),
      );
    }
    if (form.idDrena != null) {
      sets.push(
        new Set(
          this.drenaDepartements
            .filter((option) => this.refId(option, 'drena') === form.idDrena)
            .map((option) => this.refId(option, 'departement'))
            .filter((id): id is number => id != null),
        ),
      );
    }
    if (sets.length === 0) {
      return null;
    }
    return sets.reduce((acc, set) => this.intersection(acc, set));
  }

  private allowedDrenaIds(regionId: number | null): Set<number> | null {
    if (regionId == null) {
      return null;
    }
    const regionDepartementIds = new Set(
      this.departements
        .filter((option) => this.refId(option, 'region') === regionId)
        .map((option) => option.id),
    );
    return new Set(
      this.drenaDepartements
        .filter((option) => {
          const departementId = this.refId(option, 'departement');
          return departementId != null && regionDepartementIds.has(departementId);
        })
        .map((option) => this.refId(option, 'drena'))
        .filter((id): id is number => id != null),
    );
  }

  private allowedSousPrefectureIds(form: AppUserAdminUpsertRequest): Set<number> | null {
    if (form.idDepartement != null) {
      return new Set(
        this.sousPrefectures
          .filter((option) => this.refId(option, 'departement') === form.idDepartement)
          .map((option) => option.id),
      );
    }
    const departementIds = this.allowedDepartementIds(form);
    if (departementIds == null) {
      return null;
    }
    return new Set(
      this.sousPrefectures
        .filter((option) => {
          const departementId = this.refId(option, 'departement');
          return departementId != null && departementIds.has(departementId);
        })
        .map((option) => option.id),
    );
  }

  private hasUpperLocaliteFilter(form: AppUserAdminUpsertRequest): boolean {
    return (
      form.idRegion != null ||
      form.idDrena != null ||
      form.idDepartement != null ||
      form.idSousPrefecture != null
    );
  }

  private scopeSelectionsAreConsistent(form: AppUserAdminUpsertRequest): boolean {
    return this.scopeConfigs.every((scope) => {
      const value = form[scope.key];
      return value == null || this.filteredScopeOptions(scope.key, form).some((option) => option.id === value);
    });
  }

  private refId(option: AdminScopeOption, refKey: string): number | null {
    const ref = option[refKey];
    if (ref != null && typeof ref === 'object') {
      return this.toNumberOrNull((ref as { id?: unknown }).id);
    }
    return this.toNumberOrNull(option[`id${refKey.charAt(0).toUpperCase()}${refKey.slice(1)}`]);
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private intersection(a: Set<number>, b: Set<number>): Set<number> {
    return new Set([...a].filter((value) => b.has(value)));
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const msg = String((e.error as any)?.message ?? '');
      return msg ? `Erreur serveur: ${e.status} ${e.statusText} — ${msg}` : `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}

