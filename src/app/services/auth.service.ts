import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';
import {
  AuthMeResponse,
  LoginRequest,
  LoginResponse,
} from '../core/models/auth.models';
import { TokenStorageService } from './token-storage.service';

export interface AuthSession {
  userId: number;
  username: string;
  email?: string | null;
  roles: string[];
  permissions: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session$ = new BehaviorSubject<AuthSession | null>(null);

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
    private readonly tokens: TokenStorageService,
    private readonly router: Router,
  ) {
    this.hydrateFromStorage();
  }

  get session(): Observable<AuthSession | null> {
    return this.session$.asObservable();
  }

  get currentSession(): AuthSession | null {
    return this.session$.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokens.getAccessToken();
  }

  login(body: LoginRequest): Observable<LoginResponse> {
    const url = `${this.apiBaseUrl}/api/auth/login`;
    return this.http.post<LoginResponse>(url, body).pipe(
      tap((res) => {
        this.tokens.setAccessToken(res.token);
        this.session$.next({
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
        const prev = this.session$.value;
        this.session$.next({
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
    this.session$.next(null);
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
