import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import {
  AuthMeResponse,
  AuthSession,
  LoginRequest,
  LoginResponse,
} from '@core/models/auth.models';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { SessionStore } from '@services/session-store.service';
import { TokenStorageService } from '@services/token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
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

  isAuthenticated(): boolean {
    return !!this.tokens.getAccessToken();
  }

  login(body: LoginRequest): Observable<LoginResponse> {
    const url = `${this.apiBaseUrl}/api/auth/login`;
    return this.http.post<LoginResponse>(url, body).pipe(
      tap((res) => {
        this.tokens.setAccessToken(res.token);
        this.sessionStore.setSession({
          userId: res.userId,
          username: res.username,
          email: res.email,
          roles: res.roles ?? [],
          permissions: res.permissions ?? [],
        });
      }),
    );
  }

  refreshMe(): Observable<AuthMeResponse> {
    const url = `${this.apiBaseUrl}/api/auth/me`;
    return this.http.get<AuthMeResponse>(url).pipe(
      tap((me) => {
        const prev = this.sessionStore.current;
        this.sessionStore.setSession({
          userId: me.userId,
          username: me.username,
          email: prev?.email,
          roles: prev?.roles ?? [],
          permissions: me.permissions ?? [],
        });
      }),
    );
  }

  logout(): void {
    this.tokens.clear();
    this.sessionStore.clear();
    void this.router.navigate(['/login']);
  }

  private hydrateFromStorage(): void {
    if (!this.tokens.getAccessToken()) {
      return;
    }
    this.refreshMe().subscribe({
      error: () => this.logout(),
    });
  }
}
