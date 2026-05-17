import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  normalizeAppRole,
  normalizeAppRoleList,
  normalizeFonctionnaliteList,
  normalizePermissionList,
  normalizeRoleFonctionnalitePermission,
  normalizeRfpList,
} from '@features/administration/administration-api-normalize';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { SpringPage } from '@models/centre';
import {
  AppRole,
  AdminScopeOption,
  AppUserAdmin,
  AppUserAdminUpsertRequest,
  Fonctionnalite,
  Permission,
  PersonnelAdmin,
  PersonnelAdminDashboard,
  PersonnelContextDashboard,
  RoleFonctionnalitePermission,
} from '@models/administration';

/** Paramètres optionnels pour filtrer la liste du personnel (query HTTP). */
export type PersonnelListQuery = {
  idFonction?: number | null;
  idStatutPersonnel?: number | null;
  idNiveauPersonnel?: number | null;
  idCivilite?: number | null;
  sexePersonnel?: string;
  q?: string;
};

/** Paramètres optionnels pour la liste paginée des utilisateurs (administration). */
export type AppUsersListQuery = {
  q?: string;
  roleId?: number;
  actif?: boolean;
};

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  getRoles(): Observable<AppRole[]> {
    return this.http
      .get<unknown>(`${this.apiBaseUrl}/api/app-role`)
      .pipe(map((body) => normalizeAppRoleList(body)));
  }

  getScopeOptions(apiPath: string): Observable<AdminScopeOption[]> {
    return this.http.get<unknown>(`${this.apiBaseUrl}${apiPath}`).pipe(
      map((body) => {
        const list = Array.isArray(body)
          ? body
          : Array.isArray((body as { content?: unknown[] })?.content)
            ? (body as { content: unknown[] }).content
            : [];
        return list
          .map((row) => this.normalizeScopeOption(row))
          .filter((row): row is AdminScopeOption => row != null);
      }),
    );
  }

  createRole(payload: Partial<AppRole>): Observable<AppRole> {
    return this.http
      .post<unknown>(`${this.apiBaseUrl}/api/app-role`, payload)
      .pipe(map((body) => normalizeAppRole(body as Record<string, unknown>)));
  }

  updateRole(id: number, payload: Partial<AppRole>): Observable<AppRole> {
    return this.http
      .put<unknown>(`${this.apiBaseUrl}/api/app-role/${id}`, payload)
      .pipe(map((body) => normalizeAppRole(body as Record<string, unknown>)));
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/app-role/${id}`);
  }

  getFonctionnalites(): Observable<Fonctionnalite[]> {
    return this.http
      .get<unknown>(`${this.apiBaseUrl}/api/fonctionnalite`)
      .pipe(map((body) => normalizeFonctionnaliteList(body)));
  }

  getPermissions(): Observable<Permission[]> {
    return this.http
      .get<unknown>(`${this.apiBaseUrl}/api/permission`)
      .pipe(map((body) => normalizePermissionList(body)));
  }

  getRoleFonctionnalitePermissions(): Observable<RoleFonctionnalitePermission[]> {
    return this.http
      .get<unknown>(`${this.apiBaseUrl}/api/role-fonctionnalite-permission`)
      .pipe(map((body) => normalizeRfpList(body)));
  }

  addRoleFonctionnalitePermission(
    payload: Partial<RoleFonctionnalitePermission>,
  ): Observable<RoleFonctionnalitePermission> {
    return this.http
      .post<unknown>(`${this.apiBaseUrl}/api/role-fonctionnalite-permission`, payload)
      .pipe(map((body) => normalizeRoleFonctionnalitePermission(body as Record<string, unknown>)));
  }

  removeRoleFonctionnalitePermission(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/api/role-fonctionnalite-permission/${id}`,
    );
  }

  getUsersPage(
    page: number,
    size: number,
    query: AppUsersListQuery = {},
  ): Observable<SpringPage<AppUserAdmin>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'id,asc');
    const q = String(query.q ?? '').trim();
    if (q) {
      params = params.set('q', q);
    }
    if (query.roleId != null && Number.isFinite(query.roleId)) {
      params = params.set('roleId', String(query.roleId));
    }
    if (query.actif === true) {
      params = params.set('actif', 'true');
    }
    if (query.actif === false) {
      params = params.set('actif', 'false');
    }
    return this.http.get<SpringPage<AppUserAdmin>>(`${this.apiBaseUrl}/api/app-users`, { params });
  }

  createUser(payload: AppUserAdminUpsertRequest): Observable<AppUserAdmin> {
    return this.http.post<AppUserAdmin>(`${this.apiBaseUrl}/api/app-users`, payload);
  }

  updateUser(userId: number, payload: AppUserAdminUpsertRequest): Observable<AppUserAdmin> {
    return this.http.put<AppUserAdmin>(`${this.apiBaseUrl}/api/app-users/${userId}`, payload);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/app-users/${userId}`);
  }

  updateUserRoles(userId: number, roleIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.apiBaseUrl}/api/app-users/${userId}/roles`, {
      roleIds,
    });
  }

  listPersonnelByCentrePage(
    centreId: number,
    page: number,
    size: number,
    query: PersonnelListQuery = {},
  ): Observable<SpringPage<PersonnelAdmin>> {
    let params = new HttpParams()
      .set('centreId', String(centreId))
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'id,asc');
    if (query.idFonction != null) {
      params = params.set('idFonction', String(query.idFonction));
    }
    if (query.idStatutPersonnel != null) {
      params = params.set('idStatutPersonnel', String(query.idStatutPersonnel));
    }
    if (query.idNiveauPersonnel != null) {
      params = params.set('idNiveauPersonnel', String(query.idNiveauPersonnel));
    }
    if (query.idCivilite != null) {
      params = params.set('idCivilite', String(query.idCivilite));
    }
    const sexe = String(query.sexePersonnel ?? '').trim();
    if (sexe !== '') {
      params = params.set('sexePersonnel', sexe);
    }
    const q = String(query.q ?? '').trim();
    if (q !== '') {
      params = params.set('q', q);
    }
    return this.http.get<SpringPage<PersonnelAdmin>>(`${this.apiBaseUrl}/api/admin/personnel`, {
      params,
    });
  }

  getPersonnelDashboard(centreId: number): Observable<PersonnelAdminDashboard> {
    return this.http.get<PersonnelAdminDashboard>(
      `${this.apiBaseUrl}/api/admin/personnel/dashboard`,
      { params: { centreId } },
    );
  }

  getPersonnelContextDashboard(params: {
    centreId?: number | null;
    centreType?: string | null;
  }): Observable<PersonnelContextDashboard> {
    let httpParams = new HttpParams();
    if (params.centreId != null) {
      httpParams = httpParams.set('centreId', String(params.centreId));
    } else if (params.centreType != null && params.centreType.trim() !== '') {
      httpParams = httpParams.set('centreType', params.centreType.trim());
    }
    return this.http.get<PersonnelContextDashboard>(
      `${this.apiBaseUrl}/api/admin/personnel/dashboard`,
      { params: httpParams },
    );
  }

  createPersonnel(payload: any): Observable<PersonnelAdmin> {
    return this.http.post<PersonnelAdmin>(`${this.apiBaseUrl}/api/admin/personnel`, payload);
  }

  updatePersonnel(id: number, payload: any): Observable<PersonnelAdmin> {
    return this.http.put<PersonnelAdmin>(`${this.apiBaseUrl}/api/admin/personnel/${id}`, payload);
  }

  deletePersonnel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/admin/personnel/${id}`);
  }

  private normalizeScopeOption(row: unknown): AdminScopeOption | null {
    if (row == null || typeof row !== 'object') {
      return null;
    }
    const r = row as Record<string, unknown>;
    const id = Number(r['id']);
    if (!Number.isFinite(id)) {
      return null;
    }
    const code = this.firstText(r, [
      'code',
      'codeRegion',
      'codeDrena',
      'codeIep',
      'codeDepartement',
      'codeSousPrefecture',
      'codeCommune',
      'codeLocalite',
    ]);
    const libelle = this.firstText(r, [
      'libelle',
      'libelleRegion',
      'nomDrena',
      'nomIep',
      'nomDepartement',
      'nomSousPrefecture',
      'nomCommune',
      'nomLocalite',
    ]);
    return { ...r, id, code, libelle };
  }

  private firstText(row: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = row[key];
      if (value != null && String(value).trim()) {
        return String(value).trim();
      }
    }
    return null;
  }
}
