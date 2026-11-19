import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@services/auth.service';
import { SessionStore } from '@services/session-store.service';
import { TokenStorageService } from '@services/token-storage.service';
import { SessionExpiryService } from './session-expiry.service';

describe('SessionExpiryService', () => {
  let service: SessionExpiryService;
  let tokens: jasmine.SpyObj<TokenStorageService>;
  let sessionStore: jasmine.SpyObj<SessionStore>;
  let auth: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;
  let notification: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    tokens = jasmine.createSpyObj('TokenStorageService', ['clear', 'getAccessToken']);
    sessionStore = jasmine.createSpyObj('SessionStore', ['clear']);
    auth = jasmine.createSpyObj('AuthService', [], { isLoginInFlight: false });
    router = jasmine.createSpyObj('Router', ['navigateByUrl']);
    router.navigateByUrl.and.returnValue(Promise.resolve(true));
    notification = jasmine.createSpyObj('NotificationService', ['show']);

    TestBed.configureTestingModule({
      providers: [
        SessionExpiryService,
        { provide: TokenStorageService, useValue: tokens },
        { provide: SessionStore, useValue: sessionStore },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
        { provide: NotificationService, useValue: notification },
      ],
    });
    service = TestBed.inject(SessionExpiryService);
  });

  it('isSessionExpiredStatus ne reconnaît que le 401', () => {
    expect(service.isSessionExpiredStatus(401)).toBeTrue();
    expect(service.isSessionExpiredStatus(403)).toBeFalse();
    expect(service.isSessionExpiredStatus(500)).toBeFalse();
  });

  it('handleSessionExpired notifie, nettoie et redirige', fakeAsync(() => {
    service.handleSessionExpired();
    expect(notification.show).toHaveBeenCalled();
    expect(tokens.clear).toHaveBeenCalled();
    expect(sessionStore.clear).toHaveBeenCalled();
    tick(300);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  }));

  it('ignore les appels concurrents', fakeAsync(() => {
    service.handleSessionExpired();
    service.handleSessionExpired();
    expect(notification.show).toHaveBeenCalledTimes(1);
    tick(300);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
  }));
});