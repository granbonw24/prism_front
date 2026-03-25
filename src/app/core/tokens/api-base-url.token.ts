import { InjectionToken } from '@angular/core';

/** URL racine du backend (ex. http://localhost:8080) */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
