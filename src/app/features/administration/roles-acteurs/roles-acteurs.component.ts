import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AppRole,
  Fonctionnalite,
  Permission,
  RoleFonctionnalitePermission,
} from '@models/administration';
import {
  AdministrationService,
} from '@services/administration.service';

type RoleId = number | null;

@Component({
  selector: 'app-roles-acteurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-acteurs.component.html',
  styleUrl: './roles-acteurs.component.css',
})
export class RolesActeursComponent {
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  roles: AppRole[] = [];
  fonctionnalites: Fonctionnalite[] = [];
  permissions: Permission[] = [];

  allMappings: RoleFonctionnalitePermission[] = [];
  selectedRoleId: RoleId = null;

  private currentAllowed = new Set<string>();

  constructor(private readonly admin: AdministrationService) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  private async reload(): Promise<void> {
    this.loading = true;
    this.errorMessage = null;
    try {
      const [roles, fonctionnalites, permissions, mappings] =
        await Promise.all([
          firstValueFrom(this.admin.getRoles()),
          firstValueFrom(this.admin.getFonctionnalites()),
          firstValueFrom(this.admin.getPermissions()),
          firstValueFrom(this.admin.getRoleFonctionnalitePermissions()),
        ]);

      this.roles = roles;
      this.fonctionnalites = fonctionnalites;
      this.permissions = permissions;
      this.allMappings = mappings;

      if (this.selectedRoleId == null && roles.length > 0) {
        this.selectedRoleId = roles[0]?.id ?? null;
      }

      this.rebuildAllowedSet();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.loading = false;
    }
  }

  async onRoleChange(): Promise<void> {
    this.rebuildAllowedSet();
  }

  isChecked(fnId: number, permId: number): boolean {
    return this.currentAllowed.has(`${fnId}:${permId}`);
  }

  async toggle(
    fnId: number,
    permId: number,
    ev: Event,
  ): Promise<void> {
    if (this.selectedRoleId == null) return;
    const target = ev.target as HTMLInputElement | null;
    const checked = target?.checked ?? false;
    this.saving = true;
    this.errorMessage = null;
    try {
      const existing = this.allMappings.find(
        (m) =>
          m?.role?.id === this.selectedRoleId &&
          m?.fonctionnalite?.id === fnId &&
          m?.permission?.id === permId,
      );

      if (checked) {
        if (!existing) {
          await firstValueFrom(
            this.admin.addRoleFonctionnalitePermission({
              role: { id: this.selectedRoleId },
              fonctionnalite: { id: fnId },
              permission: { id: permId },
            }),
          );
        }
      } else {
        if (existing?.id != null) {
          await firstValueFrom(
            this.admin.removeRoleFonctionnalitePermission(existing.id),
          );
        }
      }

      // Recharger pour refléter l'état exact côté serveur
      await this.reload();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.saving = false;
    }
  }

  private rebuildAllowedSet(): void {
    const set = new Set<string>();
    if (this.selectedRoleId == null) {
      this.currentAllowed = set;
      return;
    }

    for (const m of this.allMappings) {
      const roleId = m?.role?.id;
      if (roleId !== this.selectedRoleId) continue;
      const fnId = m?.fonctionnalite?.id;
      const permId = m?.permission?.id;
      if (fnId == null || permId == null) continue;
      set.add(`${fnId}:${permId}`);
    }

    this.currentAllowed = set;
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      return `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}

