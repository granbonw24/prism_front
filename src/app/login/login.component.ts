import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BRAND_CONFIG } from '@core/config/brand.config';
import { TimeoutError, firstValueFrom, timeout } from 'rxjs';
import { appHomeHref } from '@core/utils/app-home-url';
import { AuthService } from '@services/auth.service';
import { MenaPasswordFieldComponent } from '@shared/mena-password-field/mena-password-field.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MenaPasswordFieldComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly brandPanelSrc = BRAND_CONFIG.loginPanelSrc;
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;
  readonly loginTagline = BRAND_CONFIG.loginTagline;

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submitting = false;
  errorMessage: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
  ) {}

  async submit(): Promise<void> {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting) {
      return;
    }
    this.submitting = true;
    const { username, password } = this.form.getRawValue();
    this.auth.prepareForLogin();
    try {
      await firstValueFrom(this.auth.login({ username, password }).pipe(timeout(30_000)));
      // Rechargement complet : évite un Router figé après un 200 (session déjà en localStorage).
      // base href (ex. /dcspa/) — jamais '/' : Apache 301 / → /dismas/ sur le VPS.
      window.location.replace(appHomeHref());
    } catch (err: unknown) {
      this.submitting = false;
      if (err instanceof TimeoutError) {
        this.errorMessage =
          'Délai dépassé : le serveur ne répond pas. Vérifiez que le backend tourne (port 8080 en local).';
        return;
      }
      const status =
        err != null && typeof err === 'object' && 'status' in err
          ? Number((err as { status?: unknown }).status)
          : null;
      if (status === 0) {
        this.errorMessage =
          'Connexion impossible : backend injoignable ou requête annulée. Vérifiez http://localhost:8080 (local) ou le port 91 (staging).';
        return;
      }
      if (status === 404) {
        this.errorMessage =
          'API introuvable : vérifiez apiBaseUrl (local : http://localhost:8080, staging : /dcspa).';
        return;
      }
      if (err instanceof Error && err.message === 'Réponse login sans jeton') {
        this.errorMessage = 'Réponse serveur invalide (jeton manquant).';
        return;
      }
      this.errorMessage = 'Identifiants incorrects ou compte indisponible.';
    }
  }
}
