import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdministrationService, AppRole } from '@services/administration.service';

@Component({
  selector: 'app-acteurs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './acteurs.component.html',
  styleUrl: './acteurs.component.css',
})
export class ActeursComponent {
  roles: AppRole[] = [];
  loading = false;
  saving = false;
  errorMessage: string | null = null;

  editingRoleId: number | null = null;
  editRole: Partial<AppRole> | null = null;

  newRole: Partial<AppRole> = {
    libelleRole: '',
    descriptionRole: '',
  };

  constructor(private readonly admin: AdministrationService) {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.errorMessage = null;
    this.admin.getRoles().subscribe({
      next: (roles) => {
        this.roles = [...roles].sort((a, b) =>
          (a.libelleRole ?? a.codeRole ?? '').localeCompare(
            b.libelleRole ?? b.codeRole ?? '',
          ),
        );
        this.loading = false;
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.loading = false;
      },
    });
  }

  canCreate(): boolean {
    const libelle = (this.newRole.libelleRole ?? '').trim();
    return libelle.length > 0 && !this.saving;
  }

  create(): void {
    if (!this.canCreate()) return;
    this.saving = true;
    this.errorMessage = null;

    const payload: Partial<AppRole> = {
      libelleRole: (this.newRole.libelleRole ?? '').trim(),
      descriptionRole: (this.newRole.descriptionRole ?? '').trim() || undefined,
    };

    this.admin.createRole(payload).subscribe({
      next: () => {
        this.newRole = { libelleRole: '', descriptionRole: '' };
        this.saving = false;
        this.reload();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  deleteRole(role: AppRole): void {
    if (this.saving) return;
    if (!confirm(`Supprimer le rôle "${role.libelleRole ?? role.codeRole ?? role.id}" ?`)) {
      return;
    }
    this.saving = true;
    this.errorMessage = null;
    this.admin.deleteRole(role.id).subscribe({
      next: () => {
        this.saving = false;
        this.reload();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  startEdit(role: AppRole): void {
    if (this.saving) return;
    this.editingRoleId = role.id;
    this.editRole = {
      libelleRole: role.libelleRole ?? '',
      descriptionRole: role.descriptionRole ?? '',
    };
  }

  cancelEdit(): void {
    if (this.saving) return;
    this.editingRoleId = null;
    this.editRole = null;
  }

  canSaveEdit(): boolean {
    if (this.saving || this.editingRoleId == null || this.editRole == null) return false;
    const libelle = (this.editRole.libelleRole ?? '').trim();
    return libelle.length > 0;
  }

  saveEdit(): void {
    if (!this.canSaveEdit()) return;
    const id = this.editingRoleId!;
    const payload: Partial<AppRole> = {
      libelleRole: (this.editRole?.libelleRole ?? '').trim(),
      descriptionRole: (this.editRole?.descriptionRole ?? '').trim() || undefined,
    };

    this.saving = true;
    this.errorMessage = null;
    this.admin.updateRole(id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.reload();
      },
      error: (e) => {
        this.errorMessage = this.formatError(e);
        this.saving = false;
      },
    });
  }

  private formatError(e: unknown): string {
    const anyE = e as any;
    const msg =
      anyE?.error?.message ??
      anyE?.message ??
      'Erreur inattendue. Vérifiez la console et le backend.';
    return String(msg);
  }
}

