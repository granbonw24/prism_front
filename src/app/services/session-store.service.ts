import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthSession } from '@core/models/auth.models';

const SESSION_KEY = 'prism.session';

/** État session utilisateur sans dépendre de HttpClient (évite les cycles avec les intercepteurs). */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly session$ = new BehaviorSubject<AuthSession | null>(null);

  get stream(): Observable<AuthSession | null> {
    return this.session$.asObservable();
  }

  get current(): AuthSession | null {
    return this.session$.value;
  }

  setSession(session: AuthSession | null): void {
    this.session$.next(session);
    try {
      if (session) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      /* quota / mode privé */
    }
  }

  restore(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as AuthSession;
      this.session$.next(parsed);
      return parsed;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  clear(): void {
    this.setSession(null);
  }
}
