import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UiToast {
  message: string;
  variant: 'danger' | 'warning' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toast = new BehaviorSubject<UiToast | null>(null);
  readonly toast$ = this._toast.asObservable();
  private clearTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Affiche un message global (bandeau au-dessus du contenu).
   * @param ttlMs durée avant fermeture auto ; 0 = pas d’auto-fermeture
   */
  show(
    message: string,
    variant: UiToast['variant'] = 'danger',
    ttlMs = 8000,
  ): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = undefined;
    }
    this._toast.next({ message, variant });
    if (ttlMs > 0) {
      this.clearTimer = setTimeout(() => this.clear(), ttlMs);
    }
  }

  clear(): void {
    if (this.clearTimer) {
      clearTimeout(this.clearTimer);
      this.clearTimer = undefined;
    }
    this._toast.next(null);
  }
}
