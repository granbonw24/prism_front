import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { AuthService } from './auth.service';

describe('AuthService login', () => {
  let auth: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost:8080' },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true), navigateByUrl: () => Promise.resolve(true) } },
      ],
    });
    localStorage.clear();
    sessionStorage.clear();
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('enregistre le jeton et la session sans appeler /me', async () => {
    spyOn(window, 'fetch').and.resolveTo(
      new Response(
        JSON.stringify({
          token: 'jwt-test',
          type: 'Bearer',
          userId: 1,
          username: 'admin',
          email: 'admin@prism.local',
          roles: ['SUPER_ROOT'],
          permissions: [],
          nationalView: true,
          scopeMode: 'NATIONAL',
          scopeLabel: 'Vue nationale',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    auth.prepareForLogin();
    const res = await new Promise((resolve, reject) => {
      auth.login({ username: 'admin', password: 'admin123' }).subscribe({ next: resolve, error: reject });
    });

    expect(res).toBeTruthy();
    expect(window.fetch).toHaveBeenCalled();
    expect(auth.isAuthenticated()).toBeTrue();
    expect(auth.currentSession?.username).toBe('admin');
    expect(auth.hasPermission('CENTRES_ALPHA:LIRE')).toBeTrue();
  });
});
