import { AsyncPipe, NgIf } from '@angular/common';
import { Component, HostListener } from '@angular/core';
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

  /** Menu utilisateur (topbar) : contrôlé par Angular, sans `data-toggle` Bootstrap. */
  userMenuOpen = false;
  logoutModalOpen = false;

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

  toggleUserMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.userMenuOpen = !this.userMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = event.target as HTMLElement | null;
    if (el?.closest('[data-mena-user-menu]')) {
      return;
    }
    this.userMenuOpen = false;
  }

  openLogoutModal(event: Event): void {
    event.preventDefault();
    this.userMenuOpen = false;
    this.logoutModalOpen = true;
  }

  closeLogoutModal(): void {
    this.logoutModalOpen = false;
  }

  confirmLogout(): void {
    this.logoutModalOpen = false;
    this.logout();
  }
}
