import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { summarizeHttpErrorForToast } from '@core/utils/http-error.util';

/**
 * Feedback global pour erreurs « transverses » : évite le silence sur 5xx / réseau / 403.
 * Les 401 sont gérés par {@link unauthorizedInterceptor} ; les 4xx métier restent en priorité
 * sur les messages inline des écrans (formulaires).
 */
export const apiErrorFeedbackInterceptor: HttpInterceptorFn = (req, next) => {
  const notifier = inject(NotificationService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return throwError(() => err);
      }
      const showGlobal =
        err.status === 0 || err.status === 403 || err.status >= 500;
      if (showGlobal) {
        const variant =
          err.status === 403 ? 'warning' : 'danger';
        notifier.show(summarizeHttpErrorForToast(err), variant);
      }
      return throwError(() => err);
    }),
  );
};
