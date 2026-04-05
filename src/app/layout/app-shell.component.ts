import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [MenuComponent, RouterOutlet, NgIf, AsyncPipe, NgClass],
  styles: `
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
    }
  `,
  template: `
    <div id="wrapper" class="mena-layout-wrapper d-flex w-100">
      <app-menu></app-menu>
      <div
        id="content-wrapper"
        class="d-flex flex-column flex-grow-1 min-vw-0 mena-content-wrapper"
      >
        <div
          *ngIf="notification.toast$ | async as t"
          class="container-fluid px-2 px-sm-3 pt-2 pt-md-3 pb-0"
        >
          <div
            class="alert alert-dismissible fade show border-0 shadow-sm mb-0 mena-global-toast"
            [ngClass]="{
              'alert-danger': t.variant === 'danger',
              'alert-warning': t.variant === 'warning',
              'alert-info': t.variant === 'info',
            }"
            role="alert"
          >
            {{ t.message }}
            <button
              type="button"
              class="close"
              aria-label="Fermer"
              (click)="notification.clear()"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
        </div>
        <router-outlet />
      </div>
    </div>
  `,
})
export class AppShellComponent {
  readonly notification = inject(NotificationService);
}
