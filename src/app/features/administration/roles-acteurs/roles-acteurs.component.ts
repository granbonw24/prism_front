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
import { AdministrationService } from '@services/administration.service';
import { MenaSearchableSelectComponent } from '@shared/mena-searchable-select/mena-searchable-select.component';
import { sortByLabel, toMenaSelectOptions } from '@shared/mena-searchable-select/mena-select-options.util';

type RoleId = number | null;

@Component({
  selector: 'app-roles-acteurs',
  standalone: true,
  imports: [CommonModule, FormsModule, MenaSearchableSelectComponent],
  templateUrl: './roles-acteurs.component.html',
  styleUrl: './roles-acteurs.component.css',
})
export class RolesActeursComponent {
  loading = false;
  errorMessage: string | null = null;

  roles: AppRole[] = [];
  fonctionnalites: Fonctionnalite[] = [];
  permissions: Permission[] = [];

  allMappings: RoleFonctionnalitePermission[] = [];
  selectedRoleId: RoleId = null;

  private currentAllowed = new Set<string>();
  /** Cases en cours d’enregistrement (une seule à la fois par cellule). */
  private pendingCells = new Set<string>();

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

      this.roles = sortByLabel(roles, (role) => this.roleOptionLabel(role));
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
    return this.currentAllowed.has(this.cellKey(fnId, permId));
  }

  isPending(fnId: number, permId: number): boolean {
    return this.pendingCells.has(this.cellKey(fnId, permId));
  }

  trackFonctionnalite(_index: number, f: Fonctionnalite): number {
    return f.id;
  }

  trackPermission(_index: number, p: Permission): number {
    return p.id;
  }

  async toggle(fnId: number, permId: number, ev: Event): Promise<void> {
    if (this.selectedRoleId == null) return;

    const key = this.cellKey(fnId, permId);
    if (this.pendingCells.has(key)) return;

    const target = ev.target as HTMLInputElement | null;
    const checked = target?.checked ?? false;
    const wasChecked = this.currentAllowed.has(key);

    if (checked === wasChecked) return;

    this.applyChecked(key, checked);
    this.pendingCells.add(key);
    this.errorMessage = null;

    const existing = this.findMapping(fnId, permId);

    try {
      if (checked) {
        if (!existing) {
          const created = await firstValueFrom(
            this.admin.addRoleFonctionnalitePermission({
              role: { id: this.selectedRoleId },
              fonctionnalite: { id: fnId },
              permission: { id: permId },
            }),
          );
          this.allMappings = [...this.allMappings, created];
        }
      } else if (existing?.id != null) {
        await firstValueFrom(
          this.admin.removeRoleFonctionnalitePermission(existing.id),
        );
        this.allMappings = this.allMappings.filter((m) => m.id !== existing.id);
      }
    } catch (e) {
      this.applyChecked(key, wasChecked);
      if (target) {
        target.checked = wasChecked;
      }
      this.errorMessage = this.formatError(e);
    } finally {
      this.pendingCells.delete(key);
    }
  }

  private cellKey(fnId: number, permId: number): string {
    return `${fnId}:${permId}`;
  }

  private applyChecked(key: string, checked: boolean): void {
    if (checked) {
      this.currentAllowed.add(key);
    } else {
      this.currentAllowed.delete(key);
    }
  }

  private findMapping(
    fnId: number,
    permId: number,
  ): RoleFonctionnalitePermission | undefined {
    return this.allMappings.find(
      (m) =>
        m?.role?.id === this.selectedRoleId &&
        m?.fonctionnalite?.id === fnId &&
        m?.permission?.id === permId,
    );
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

  roleOptionLabel(r: AppRole): string {
    const lib = (r.libelleRole ?? '').trim();
    const code = (r.codeRole ?? '').trim();
    if (lib && code) return `${lib} (${code})`;
    return lib || code || String(r.id);
  }

  menaRoleOptions() {
    return toMenaSelectOptions(this.roles, (role) => role.id, (role) => this.roleOptionLabel(role));
  }

  permissionColumnLabel(p: Permission): string {
    const lib = (p.libellePermission ?? '').trim();
    const code = (p.codePermission ?? '').trim();
    if (lib && code) return `${lib} · ${code}`;
    return lib || code || String(p.id);
  }

  /** Libellé court pour l’en-tête de colonne (évite l’étirement horizontal). */
  permissionHeaderShort(p: Permission): string {
    const code = (p.codePermission ?? '').trim();
    if (code) {
      return code.length > 14 ? `${code.slice(0, 13)}…` : code;
    }
    const lib = (p.libellePermission ?? '').trim();
    if (!lib) return String(p.id);
    return lib.length > 14 ? `${lib.slice(0, 13)}…` : lib;
  }

  fonctionnaliteRowLabel(f: Fonctionnalite): string {
    const lib = (f.libelleFonctionnalite ?? '').trim();
    const code = (f.codeFonctionnalite ?? '').trim();
    if (lib && code) return `${lib} (${code})`;
    return lib || code || String(f.id);
  }
}

