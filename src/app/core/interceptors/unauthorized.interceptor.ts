import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionExpiryService } from '@core/services/session-expiry.service';
import { AuthService } from '@services/auth.service';
import { SessionStore } from '@services/session-store.service';
import { TokenStorageService } from '@services/token-storage.service';

/**
 * Session expirée ou refusée : nettoie le stockage et renvoie vers la page de connexion.
 * Ne s'applique pas à POST /api/auth/login (identifiants invalides).
 */
export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorageService);
  const sessionStore = inject(SessionStore);
  const auth = inject(AuthService);
  const sessionExpiry = inject(SessionExpiryService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLoginAttempt = req.url.includes('/api/auth/login');
      if (
        sessionExpiry.isSessionExpiredStatus(err.status) &&
        !isLoginAttempt
      ) {
        if (auth.isLoginInFlight) {
          return throwError(() => err);
        }
        sessionExpiry.handleSessionExpired();
        return throwError(() => err);
      }

      if (err.status === 401 && isLoginAttempt) {
        tokens.clear();
        sessionStore.clear();
      }
      return throwError(() => err);
    }),
  );
};