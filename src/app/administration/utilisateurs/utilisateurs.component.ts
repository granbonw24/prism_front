import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdministrationService, AppRole, AppUserAdmin } from '../../services/administration.service';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './utilisateurs.component.html',
  styleUrl: './utilisateurs.component.css',
})
export class UtilisateursComponent {
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  roles: AppRole[] = [];
  users: AppUserAdmin[] = [];

  constructor(private readonly admin: AdministrationService) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;
    try {
      const [roles, users] = await Promise.all([
        firstValueFrom(this.admin.getRoles()),
        firstValueFrom(this.admin.getUsers()),
      ]);
      this.roles = roles;
      this.users = users;
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.loading = false;
    }
  }

  isChecked(user: AppUserAdmin, roleId: number): boolean {
    return (user.roleIds ?? []).includes(roleId);
  }

  async toggleRole(
    user: AppUserAdmin,
    roleId: number,
    ev: Event,
  ): Promise<void> {
    if (this.saving) return;

    const target = ev.target as HTMLInputElement | null;
    const checked = target?.checked ?? false;

    const set = new Set<number>(user.roleIds ?? []);
    if (checked) set.add(roleId);
    else set.delete(roleId);

    this.saving = true;
    this.errorMessage = null;

    try {
      await firstValueFrom(
        this.admin.updateUserRoles(user.id, Array.from(set)),
      );
      await this.reload();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.saving = false;
    }
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      return `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}

