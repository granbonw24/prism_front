import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PASSWORD_MIN_LENGTH } from '@core/auth/password-policy';
import { AuthSession } from '@core/models/auth.models';
import { formatHttpError } from '@core/utils/http-error.util';
import { AuthPresentationService } from '@services/auth-presentation.service';
import { AuthService } from '@services/auth.service';
import { MenaPasswordFieldComponent } from '@shared/mena-password-field/mena-password-field.component';
import { firstValueFrom } from 'rxjs';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const neu = String(group.get('newPassword')?.value ?? '');
  const confirm = String(group.get('confirmPassword')?.value ?? '');
  if (!neu || !confirm) return null;
  return neu === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, ReactiveFormsModule, MenaPasswordFieldComponent],
  templateUrl: './profil.component.html',
})
export class ProfilComponent implements OnInit {
  readonly session$ = this.auth.session;
  readonly passwordMinLength = PASSWORD_MIN_LENGTH;

  accessDeniedMessage: string | null = null;
  profileLoadError: string | null = null;
  profileMessage: string | null = null;
  profileError: string | null = null;
  passwordMessage: string | null = null;
  passwordError: string | null = null;
  savingProfile = false;
  savingPassword = false;

  readonly profileForm = this.fb.nonNullable.group({
    nom: [''],
    prenoms: [''],
    email: ['', [Validators.email]],
    dateNaissance: [''],
    lieuNaissance: [''],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  constructor(
    private readonly auth: AuthService,
    readonly presentation: AuthPresentationService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('accessDenied') === '1') {
      const raw = q.get('required') ?? '';
      this.accessDeniedMessage = this.formatAccessDeniedMessage(raw);
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { accessDenied: null, required: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    this.auth.refreshMe().subscribe({
      next: () => this.patchProfile(this.auth.currentSession),
      error: () => {
        this.profileLoadError =
          'Impossible de charger votre profil. Vérifiez la connexion au serveur ou reconnectez-vous.';
      },
    });
  }

  dismissAccessDenied(): void {
    this.accessDeniedMessage = null;
  }

  async saveProfile(): Promise<void> {
    this.profileError = null;
    this.profileMessage = null;
    if (this.profileForm.invalid || this.savingProfile) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile = true;
    const v = this.profileForm.getRawValue();
    try {
      await firstValueFrom(
        this.auth.updateProfile({
          nom: v.nom.trim() || null,
          prenoms: v.prenoms.trim() || null,
          email: v.email.trim() || null,
          dateNaissance: v.dateNaissance.trim() || null,
          lieuNaissance: v.lieuNaissance.trim() || null,
        }),
      );
      this.patchProfile(this.auth.currentSession);
      this.profileMessage = 'Profil enregistré.';
    } catch (err) {
      this.profileError = formatHttpError(err, 'Enregistrement du profil impossible.');
    } finally {
      this.savingProfile = false;
    }
  }

  async savePassword(): Promise<void> {
    this.passwordError = null;
    this.passwordMessage = null;
    if (this.passwordForm.invalid || this.savingPassword) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const v = this.passwordForm.getRawValue();
    this.savingPassword = true;
    try {
      await firstValueFrom(
        this.auth.changePassword({
          currentPassword: v.currentPassword,
          newPassword: v.newPassword,
        }),
      );
      this.passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      this.passwordMessage = 'Mot de passe modifié. Utilisez-le à la prochaine connexion.';
    } catch (err) {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        this.passwordError = 'Session expirée. Reconnectez-vous.';
      } else {
        this.passwordError = formatHttpError(err, 'Changement de mot de passe impossible.');
      }
    } finally {
      this.savingPassword = false;
    }
  }

  roles(session: AuthSession): string {
    return session.roles.length > 0 ? session.roles.join(', ') : 'Aucun rôle renseigné';
  }

  permissionsCount(session: AuthSession): number {
    return session.permissions.length;
  }

  private patchProfile(session: AuthSession | null): void {
    if (!session) return;
    this.profileForm.patchValue({
      nom: session.nom ?? '',
      prenoms: session.prenoms ?? '',
      email: session.email ?? '',
      dateNaissance: this.toDateInput(session.dateNaissance),
      lieuNaissance: session.lieuNaissance ?? '',
    });
  }

  private toDateInput(value: string | null | undefined): string {
    if (!value) return '';
    return String(value).slice(0, 10);
  }

  private formatAccessDeniedMessage(raw: string): string {
    const base =
      "Vous n'avez pas les droits nécessaires pour accéder à la page ou à l'action demandée.";
    const suffix = ' Si votre rôle doit évoluer, contactez un administrateur de la plateforme.';
    const trimmed = raw.trim();
    if (!trimmed) {
      return `${base}${suffix}`;
    }
    if (trimmed.startsWith('ONE_OF:')) {
      const list = trimmed
        .slice('ONE_OF:'.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const detail =
        list.length > 0
          ? ` Il faut au moins l'une des permissions suivantes : ${list.join(', ')}.`
          : '';
      return `${base}${detail}${suffix}`;
    }
    return `${base} Permission attendue : ${trimmed}.${suffix}`;
  }
}
