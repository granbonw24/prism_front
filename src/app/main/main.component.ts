import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthSession } from '@core/models/auth.models';
import { BRAND_CONFIG } from '@core/config/brand.config';
import { AuthPresentationService } from '@services/auth-presentation.service';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AsyncPipe, NgIf],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent {
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;

  constructor(
    readonly auth: AuthService,
    private readonly authPresentation: AuthPresentationService,
  ) {}

  userHeaderLabel(session: AuthSession | null): string {
    return this.authPresentation.headerLabel(session);
  }

  userRoleLabel(session: AuthSession | null): string {
    return this.authPresentation.roleLabel(session);
  }

  logout(): void {
    this.auth.logout();
  }
}
