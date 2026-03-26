import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { BRAND_CONFIG } from '../core/config/brand.config';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  readonly brandPanelSrc = BRAND_CONFIG.loginPanelSrc;
  readonly brandMarkSrc = BRAND_CONFIG.markSrc;
  readonly brandAlt = BRAND_CONFIG.alt;

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submitting = false;
  errorMessage: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  submit(): void {
    this.errorMessage = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const { username, password } = this.form.getRawValue();
    this.auth.login({ username, password }).subscribe({
      next: () => {
        this.submitting = false;
        void this.router.navigateByUrl('/');
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = 'Identifiants incorrects ou compte indisponible.';
      },
    });
  }
}
