import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AdministrationService, AppRole, AppUserAdmin, AppUserAdminUpsertRequest } from '../../services/administration.service';

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

  detailsUser: AppUserAdmin | null = null;
  editUserId: number | null = null;
  createOpen = false;
  createForm: AppUserAdminUpsertRequest = {
    username: '',
    email: '',
    actif: true,
    password: '',
    roleIds: [],
  };
  editForm: AppUserAdminUpsertRequest = {
    username: '',
    email: '',
    actif: true,
    password: '',
    roleIds: [],
  };

  roleFilterCreate = '';
  roleFilterEdit = '';
  createSelectedRoleId: number | null = null;
  editSelectedRoleId: number | null = null;

  constructor(private readonly admin: AdministrationService) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
  }

  async reload(): Promise<void> {
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

  openCreate(): void {
    this.createOpen = true;
    this.roleFilterCreate = '';
    this.createForm = {
      username: '',
      email: '',
      actif: true,
      password: '',
      roleIds: [],
    };
    this.createSelectedRoleId = null;
  }

  closeCreate(): void {
    this.createOpen = false;
  }

  canCreate(): boolean {
    return (
      !this.saving &&
      String(this.createForm.username ?? '').trim().length > 0 &&
      String(this.createForm.password ?? '').trim().length > 0
    );
  }

  async createUser(): Promise<void> {
    if (!this.canCreate()) return;
    this.saving = true;
    this.errorMessage = null;
    try {
      await firstValueFrom(
        this.admin.createUser({
          username: String(this.createForm.username ?? '').trim(),
          email: String(this.createForm.email ?? '').trim() || null,
          actif: !!this.createForm.actif,
          password: String(this.createForm.password ?? ''),
          roleIds: this.createSelectedRoleId != null ? [this.createSelectedRoleId] : [],
        }),
      );
      this.closeCreate();
      await this.reload();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.saving = false;
    }
  }

  openDetails(u: AppUserAdmin): void {
    this.detailsUser = u;
  }

  closeDetails(): void {
    this.detailsUser = null;
  }

  openEdit(u: AppUserAdmin): void {
    this.editUserId = u.id;
    this.roleFilterEdit = '';
    this.editForm = {
      username: u.username,
      email: u.email ?? '',
      actif: !!u.actif,
      password: '',
      roleIds: [...(u.roleIds ?? [])],
    };
    this.editSelectedRoleId = (u.roleIds ?? [])[0] ?? null;
  }

  closeEdit(): void {
    this.editUserId = null;
  }

  canSaveEdit(): boolean {
    return !this.saving && this.editUserId != null && String(this.editForm.username ?? '').trim().length > 0;
  }

  async saveEdit(): Promise<void> {
    if (!this.canSaveEdit()) return;
    const id = this.editUserId!;
    this.saving = true;
    this.errorMessage = null;
    try {
      await firstValueFrom(
        this.admin.updateUser(id, {
          username: String(this.editForm.username ?? '').trim(),
          email: String(this.editForm.email ?? '').trim() || null,
          actif: !!this.editForm.actif,
          password: String(this.editForm.password ?? '').trim() || null,
          roleIds: this.editSelectedRoleId != null ? [this.editSelectedRoleId] : [],
        }),
      );
      this.closeEdit();
      await this.reload();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.saving = false;
    }
  }

  async deleteUser(u: AppUserAdmin): Promise<void> {
    if (this.saving) return;
    if (!confirm(`Supprimer l'utilisateur "${u.username}" ?`)) return;
    this.saving = true;
    this.errorMessage = null;
    try {
      await firstValueFrom(this.admin.deleteUser(u.id));
      await this.reload();
    } catch (e) {
      this.errorMessage = this.formatError(e);
    } finally {
      this.saving = false;
    }
  }

  roleLabel(roleId: number): string {
    const r = this.roles.find((x) => x.id === roleId);
    return String(r?.libelleRole ?? r?.codeRole ?? roleId);
  }

  filteredRoles(q: string): AppRole[] {
    const s = String(q ?? '').trim().toLowerCase();
    if (!s) return this.roles;
    return this.roles.filter((r) =>
      `${r.libelleRole ?? ''} ${r.codeRole ?? ''} ${r.id}`.toLowerCase().includes(s),
    );
  }

  trackRoleById(_idx: number, r: AppRole): number {
    return r.id;
  }

  private formatError(e: unknown): string {
    if (e instanceof HttpErrorResponse) {
      const msg = String((e.error as any)?.message ?? '');
      return msg ? `Erreur serveur: ${e.status} ${e.statusText} — ${msg}` : `Erreur serveur: ${e.status} ${e.statusText}`;
    }
    return e instanceof Error ? e.message : 'Erreur inconnue';
  }
}

