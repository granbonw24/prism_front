import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthSession } from '@core/models/auth.models';
import { BRAND_CONFIG } from '@core/config/brand.config';
import {
  WorkflowNotificationCenterService,
  type WorkflowNotificationSnapshot,
} from '@core/workflow/workflow-notification-center.service';
import { AuthPresentationService } from '@services/auth-presentation.service';
import { AuthService } from '@services/auth.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, RouterLink, AsyncPipe, NgIf, NgFor],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css',
})
export class MainComponent implements OnInit, OnDestroy {
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;

  /** Menu utilisateur (topbar) : contrôlé par Angular, sans `data-toggle` Bootstrap. */
  userMenuOpen = false;
  alertsMenuOpen = false;
  logoutModalOpen = false;

  workflowNotifications: WorkflowNotificationSnapshot = {
    total: 0,
    returns: { total: 0, items: [] },
    pending: { total: 0, items: [] },
    entries: [],
  };

  private readonly subs = new Subscription();

  constructor(
    readonly auth: AuthService,
    private readonly authPresentation: AuthPresentationService,
    private readonly workflowNotificationsService: WorkflowNotificationCenterService,
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.workflowNotificationsService.observe().subscribe((snap) => {
        this.workflowNotifications = snap;
      }),
    );
    this.subs.add(
      interval(120_000).subscribe(() => {
        if (this.auth.currentSession) {
          this.workflowNotificationsService.refresh();
        }
      }),
    );
    this.workflowNotificationsService.refresh();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  get showWorkflowAlertsBell(): boolean {
    const session = this.auth.currentSession;
    if (!this.workflowNotificationsService.canReceiveWorkflowNotifications(session)) {
      return false;
    }
    return this.workflowNotifications.total > 0;
  }

  badgeLabel(total: number): string {
    if (total > 9) {
      return '9+';
    }
    return String(total);
  }

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
    if (this.userMenuOpen) {
      this.alertsMenuOpen = false;
    }
  }

  @HostListener('document:click', ['$event'])
  toggleAlertsMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.alertsMenuOpen = !this.alertsMenuOpen;
    if (this.alertsMenuOpen) {
      this.workflowNotificationsService.refresh();
      this.userMenuOpen = false;
    }
  }

  closeAlertsMenu(): void {
    this.alertsMenuOpen = false;
  }

  onDocumentClick(event: MouseEvent): void {
    const el = event.target as HTMLElement | null;
    if (el?.closest('[data-mena-user-menu]')) {
      return;
    }
    if (el?.closest('[data-mena-alerts-menu]')) {
      return;
    }
    this.userMenuOpen = false;
    this.alertsMenuOpen = false;
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

  /** Tiroir menu mobile (remplace le toggle jQuery SB Admin, source de conflits). */
  toggleMobileNav(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!window.matchMedia('(max-width: 991.98px)').matches) {
      return;
    }
    const opening = !document.body.classList.contains('mena-mobile-nav-open');
    document.body.classList.toggle('mena-mobile-nav-open', opening);
    const toggleBtn = document.getElementById('sidebarToggleTop');
    toggleBtn?.setAttribute('aria-expanded', opening ? 'true' : 'false');
    toggleBtn?.setAttribute('aria-label', opening ? 'Fermer le menu' : 'Ouvrir le menu');
    const sidebar = document.querySelector('.sidebar.mena-sidebar');
    if (opening) {
      document.body.classList.remove('sidebar-toggled');
      sidebar?.classList.remove('toggled');
    } else {
      document.body.classList.add('sidebar-toggled');
      sidebar?.classList.add('toggled');
    }
  }
}
