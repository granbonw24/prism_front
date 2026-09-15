import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, finalize, from, of, shareReplay, takeUntil, tap } from 'rxjs';
import {
  AuthMeResponse,
  AuthSession,
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  UpdateProfileRequest,
} from '@core/models/auth.models';
import { RBAC_BYPASS_ROLE_CODES } from '@core/config/menu-rbac.config';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { SessionStore } from '@services/session-store.service';
import { TokenStorageService } from '@services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private refreshMeInFlight: Observable<AuthMeResponse> | null = null;
  private loginInFlight = false;
  /** Annule les GET /me encore en vol (évite qu'un 401 concurrent annule POST /login). */
  private readonly cancelAuthRequests$ = new Subject<void>();

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
    private readonly tokens: TokenStorageService,
    private readonly sessionStore: SessionStore,
    private readonly router: Router,
  ) {
    this.hydrateFromStorage();
  }

  get session(): Observable<AuthSession | null> {
    return this.sessionStore.stream;
  }

  get currentSession(): AuthSession | null {
    return this.sessionStore.current;
  }

  get isLoginInFlight(): boolean {
    return this.loginInFlight;
  }

  isAuthenticated(): boolean {
    return !!this.tokens.getAccessToken();
  }

  hasPermission(permission: string): boolean {
    if (this.bypassesRbac()) {
      return true;
    }
    return this.currentSession?.permissions.includes(permission) ?? false;
  }

  hasAnyPermission(permissions: string[]): boolean {
    if (this.bypassesRbac()) {
      return true;
    }
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasRole(role: string): boolean {
    return this.currentSession?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  /**
   * Avant POST /login : coupe les requêtes auth en cours et efface le stockage local.
   * Évite l'annulation du XHR login par un 401 tardif sur /me (documenté dans unauthorizedInterceptor).
   */
  prepareForLogin(): void {
    this.cancelAuthRequests$.next();
    this.refreshMeInFlight = null;
    this.tokens.clear();
    this.sessionStore.clear();
  }

  login(body: LoginRequest): Observable<LoginResponse> {
    this.loginInFlight = true;
    const url = `${this.apiBaseUrl}/api/auth/login`;
    // fetch : hors intercepteurs Angular (un 200 DevTools n'arrivait pas jusqu'au subscribe).
    return from(this.postLogin(url, body)).pipe(
      tap((res) => {
        const token = String(res?.token ?? '').trim();
        if (!token) {
          throw new Error('Réponse login sans jeton');
        }
        this.tokens.setAccessToken(token);
        this.applyAuthPayload(res);
      }),
      finalize(() => {
        this.loginInFlight = false;
      }),
    );
  }

  refreshMe(): Observable<AuthMeResponse> {
    if (this.loginInFlight) {
      const session = this.currentSession;
      if (session) {
        return of(session as AuthMeResponse);
      }
    }
    if (this.refreshMeInFlight) {
      return this.refreshMeInFlight;
    }
    const url = `${this.apiBaseUrl}/api/auth/me`;
    this.refreshMeInFlight = this.http.get<AuthMeResponse>(url).pipe(
      takeUntil(this.cancelAuthRequests$),
      tap((me) => {
        this.applyAuthPayload(me);
      }),
      finalize(() => {
        this.refreshMeInFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    return this.refreshMeInFlight;
  }

  updateProfile(body: UpdateProfileRequest): Observable<AuthMeResponse> {
    return this.http.put<AuthMeResponse>(`${this.apiBaseUrl}/api/auth/me`, body).pipe(
      tap((me) => this.applyAuthPayload(me)),
    );
  }

  changePassword(body: ChangePasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.apiBaseUrl}/api/auth/password`, body);
  }

  logout(): void {
    if (this.loginInFlight) {
      this.clearLocalSession();
      return;
    }
    this.clearLocalSession();
    void this.router.navigate(['/login']);
  }

  clearLocalSession(): void {
    this.cancelAuthRequests$.next();
    this.refreshMeInFlight = null;
    this.tokens.clear();
    this.sessionStore.clear();
  }

  private hydrateFromStorage(): void {
    if (!this.tokens.getAccessToken()) {
      this.sessionStore.clear();
      return;
    }
    this.sessionStore.restore();
  }

  private applyAuthPayload(me: AuthMeResponse | LoginResponse): void {
    const prev = this.sessionStore.current;
    const nextPermissions = Array.isArray(me.permissions)
      ? me.permissions
      : (prev?.permissions ?? []);
    this.sessionStore.setSession({
      userId: me.userId,
      username: me.username,
      email: me.email !== undefined ? me.email ?? null : (prev?.email ?? null),
      nom: me.nom !== undefined ? me.nom ?? null : (prev?.nom ?? null),
      prenoms: me.prenoms !== undefined ? me.prenoms ?? null : (prev?.prenoms ?? null),
      dateNaissance: me.dateNaissance !== undefined ? me.dateNaissance ?? null : (prev?.dateNaissance ?? null),
      lieuNaissance: me.lieuNaissance !== undefined ? me.lieuNaissance ?? null : (prev?.lieuNaissance ?? null),
      roles: Array.isArray(me.roles) ? me.roles : (prev?.roles ?? []),
      permissions: nextPermissions,
      idRegion: me.idRegion ?? prev?.idRegion ?? null,
      idDrena: me.idDrena ?? prev?.idDrena ?? null,
      idIep: me.idIep ?? prev?.idIep ?? null,
      idDepartement: me.idDepartement ?? prev?.idDepartement ?? null,
      idSousPrefecture: me.idSousPrefecture ?? prev?.idSousPrefecture ?? null,
      idCommune: me.idCommune ?? prev?.idCommune ?? null,
      idLocalite: me.idLocalite ?? prev?.idLocalite ?? null,
      region: me.region ?? prev?.region ?? null,
      drena: me.drena ?? prev?.drena ?? null,
      iep: me.iep ?? prev?.iep ?? null,
      departement: me.departement ?? prev?.departement ?? null,
      sousPrefecture: me.sousPrefecture ?? prev?.sousPrefecture ?? null,
      commune: me.commune ?? prev?.commune ?? null,
      localite: me.localite ?? prev?.localite ?? null,
      nationalView: me.nationalView ?? prev?.nationalView ?? false,
      scopeMode: me.scopeMode ?? prev?.scopeMode,
      scopeLabel: me.scopeLabel ?? prev?.scopeLabel,
    });
  }

  private async postLogin(url: string, body: LoginRequest): Promise<LoginResponse> {
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw Object.assign(new Error('network'), { status: 0 });
    }
    if (!res.ok) {
      throw Object.assign(new Error('login'), { status: res.status });
    }
    return (await res.json()) as LoginResponse;
  }

  private bypassesRbac(): boolean {
    const roles = this.currentSession?.roles ?? [];
    return roles.some((role) => RBAC_BYPASS_ROLE_CODES.has(role));
  }
}
