import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { SpringPage } from '@models/centre';
import {
  AppRole,
  AppUserAdmin,
  AppUserAdminUpsertRequest,
  Fonctionnalite,
  Permission,
  PersonnelAdmin,
  PersonnelAdminDashboard,
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

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  getRoles(): Observable<AppRole[]> {
    return this.http.get<AppRole[]>(`${this.apiBaseUrl}/api/app-role`);
  }

  createRole(payload: Partial<AppRole>): Observable<AppRole> {
    return this.http.post<AppRole>(`${this.apiBaseUrl}/api/app-role`, payload);
  }

  updateRole(id: number, payload: Partial<AppRole>): Observable<AppRole> {
    return this.http.put<AppRole>(`${this.apiBaseUrl}/api/app-role/${id}`, payload);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/app-role/${id}`);
  }

  getFonctionnalites(): Observable<Fonctionnalite[]> {
    return this.http.get<Fonctionnalite[]>(`${this.apiBaseUrl}/api/fonctionnalite`);
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.apiBaseUrl}/api/permission`);
  }

  getRoleFonctionnalitePermissions(): Observable<RoleFonctionnalitePermission[]> {
    return this.http.get<RoleFonctionnalitePermission[]>(
      `${this.apiBaseUrl}/api/role-fonctionnalite-permission`,
    );
  }

  addRoleFonctionnalitePermission(
    payload: Partial<RoleFonctionnalitePermission>,
  ): Observable<RoleFonctionnalitePermission> {
    return this.http.post<RoleFonctionnalitePermission>(
      `${this.apiBaseUrl}/api/role-fonctionnalite-permission`,
      payload,
    );
  }

  removeRoleFonctionnalitePermission(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBaseUrl}/api/role-fonctionnalite-permission/${id}`,
    );
  }

  getUsersPage(page: number, size: number): Observable<SpringPage<AppUserAdmin>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', 'id,asc');
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

  createPersonnel(payload: any): Observable<PersonnelAdmin> {
    return this.http.post<PersonnelAdmin>(`${this.apiBaseUrl}/api/admin/personnel`, payload);
  }

  updatePersonnel(id: number, payload: any): Observable<PersonnelAdmin> {
    return this.http.put<PersonnelAdmin>(`${this.apiBaseUrl}/api/admin/personnel/${id}`, payload);
  }

  deletePersonnel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/admin/personnel/${id}`);
  }
}
