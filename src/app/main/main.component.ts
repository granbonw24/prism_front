import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BRAND_CONFIG } from '@core/config/brand.config';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AsyncPipe],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent {
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;

  constructor(readonly auth: AuthService) {}

  logout(): void {
    this.auth.logout();
  }
}
