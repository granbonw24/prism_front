import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [MenuComponent, RouterOutlet],
  template: `
    <div class="row">
      <div class="col-sm-2">
        <app-menu></app-menu>
      </div>
      <div class="col-sm-10">
        <router-outlet />
      </div>
    </div>
  `,
})
export class AppShellComponent {}
