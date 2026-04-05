import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthSession } from '@core/models/auth.models';

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
  }

  clear(): void {
    this.session$.next(null);
  }
}
