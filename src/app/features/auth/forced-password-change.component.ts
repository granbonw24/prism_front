import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { PASSWORD_MIN_LENGTH } from '@core/auth/password-policy';
import { BRAND_CONFIG } from '@core/config/brand.config';
import { appHomeHref } from '@core/utils/app-home-url';
import { formatHttpError } from '@core/utils/http-error.util';
import { AuthService } from '@services/auth.service';
import { MenaPasswordFieldComponent } from '@shared/mena-password-field/mena-password-field.component';
import { firstValueFrom } from 'rxjs';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const neu = String(group.get('newPassword')?.value ?? '');
  const confirm = String(group.get('confirmPassword')?.value ?? '');
  if (!neu || !confirm) {
    return null;
  }
  return neu === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-forced-password-change',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MenaPasswordFieldComponent],
  templateUrl: './forced-password-change.component.html',
  styleUrl: './forced-password-change.component.css',
})
export class ForcedPasswordChangeComponent {
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;
  readonly passwordMinLength = PASSWORD_MIN_LENGTH;
  readonly username = this.auth.currentSession?.username ?? '';

  saving = false;
  errorMessage: string | null = null;

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(PASSWORD_MIN_LENGTH)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
  ) {}

  fieldInvalid(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): boolean {
    const c = this.form.get(controlName);
    return !!c && c.invalid && (c.touched || this.form.touched);
  }

  mismatchVisible(): boolean {
    return this.form.hasError('mismatch') && (this.form.touched || this.form.dirty);
  }

  async submit(): Promise<void> {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const { currentPassword, newPassword } = this.form.getRawValue();
    try {
      await firstValueFrom(
        this.auth.changePassword({
          currentPassword,
          newPassword,
        }),
      );
      await firstValueFrom(this.auth.refreshMe());
      window.location.replace(appHomeHref());
    } catch (e) {
      this.errorMessage =
        e instanceof HttpErrorResponse
          ? formatHttpError(e, 'Impossible de changer le mot de passe.')
          : 'Impossible de changer le mot de passe.';
    } finally {
      this.saving = false;
    }
  }

  logout(): void {
    this.auth.logout();
  }
}