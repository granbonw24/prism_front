import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';

export interface AppRole {
  id: number;
  codeRole?: string;
  libelleRole?: string;
  descriptionRole?: string;
}

export interface Fonctionnalite {
  id: number;
  codeFonctionnalite?: string;
  libelleFonctionnalite?: string;
  module?: string;
}

export interface Permission {
  id: number;
  codePermission?: string;
  libellePermission?: string;
}

export interface RoleFonctionnalitePermission {
  id: number;
  role?: { id: number };
  fonctionnalite?: { id: number };
  permission?: { id: number };
}

export interface AppUserAdmin {
  id: number;
  username: string;
  email?: string;
  actif?: boolean;
  roleIds: number[];
}

export interface AppUserAdminUpsertRequest {
  username: string;
  email?: string | null;
  actif?: boolean | null;
  password?: string | null;
  roleIds?: number[] | null;
}

export interface PersonnelAdmin {
  id: number;
  niveauPersonnelId: number | null;
  fonctionId: number | null;
  civiliteId: number | null;
  centreId: number | null;
  structureFormationCertificationId: number | null;
  statutPersonnelId: number | null;
  codePersonnel?: string | null;
  certifierPersonnel?: boolean | null;
  nomPersonnel?: string | null;
  prenomsPersonnel?: string | null;
  anneExpePersonnel?: number | null;
  sexePersonnel?: string | null;
  dateNaissance?: string | null;
  ancienneFonctPromoPesonnel?: number | null;
  contactPersonnel?: string | null;
  boitePostalePersonnel?: string | null;
  emailPersonnel?: string | null;
  denominationPersonnel?: string | null;
  nomDuPrgramme?: string | null;
  nomRepresentantLegalSturcture?: string | null;
}

export interface PersonnelAdminDashboard {
  centreId: number;
  total: number;
}

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

  getUsers(): Observable<AppUserAdmin[]> {
    return this.http.get<AppUserAdmin[]>(`${this.apiBaseUrl}/api/app-users`);
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

  listPersonnelByCentre(centreId: number): Observable<PersonnelAdmin[]> {
    return this.http.get<PersonnelAdmin[]>(`${this.apiBaseUrl}/api/admin/personnel`, {
      params: { centreId },
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
