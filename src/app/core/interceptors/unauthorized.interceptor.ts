import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { SessionStore } from '@services/session-store.service';
import { TokenStorageService } from '@services/token-storage.service';

/**
 * Session expirée ou refusée : nettoie le stockage et renvoie vers la page de connexion.
 * Ne s'applique pas à POST /api/auth/login (identifiants invalides).
 */
let unauthorizedFlowInProgress = false;

export const unauthorizedInterceptor: HttpInterceptorFn = (req, next) => {
  const tokens = inject(TokenStorageService);
  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const isLoginAttempt = req.url.includes('/api/auth/login');
      if (err.status === 401 && !isLoginAttempt) {
        if (unauthorizedFlowInProgress) {
          return throwError(() => err);
        }
        unauthorizedFlowInProgress = true;
        notification.show(
          'Votre session a expiré ou votre token est invalide. Vous allez être redirigé vers la connexion.',
          'warning',
          3500,
        );

        // Laisse un court instant pour afficher l'alerte avant déconnexion.
        setTimeout(() => {
          tokens.clear();
          sessionStore.clear();
          void router.navigateByUrl('/login', { replaceUrl: true });
          unauthorizedFlowInProgress = false;
        }, 1200);

        return throwError(() => err);
      }

      if (err.status !== 401 && unauthorizedFlowInProgress) {
        unauthorizedFlowInProgress = false;
      }

      if (err.status === 401 && isLoginAttempt) {
        tokens.clear();
        sessionStore.clear();
      }
      return throwError(() => err);
    }),
  );
};
