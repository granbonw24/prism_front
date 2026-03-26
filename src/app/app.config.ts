import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { apiErrorFeedbackInterceptor } from './core/interceptors/api-error-feedback.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { unauthorizedInterceptor } from './core/interceptors/unauthorized.interceptor';
import { API_BASE_URL } from './core/tokens/api-base-url.token';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        unauthorizedInterceptor,
        apiErrorFeedbackInterceptor,
      ]),
    ),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
  ],
};
