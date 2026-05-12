import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AuthSession } from '@core/models/auth.models';
import { AuthPresentationService } from '@services/auth-presentation.service';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf],
  templateUrl: './profil.component.html',
})
export class ProfilComponent implements OnInit {
  readonly session$ = this.auth.session;

  constructor(
    private readonly auth: AuthService,
    readonly presentation: AuthPresentationService,
  ) {}

  ngOnInit(): void {
    this.auth.refreshMe().subscribe({ error: () => undefined });
  }

  roles(session: AuthSession): string {
    return session.roles.length > 0 ? session.roles.join(', ') : 'Aucun rôle renseigné';
  }

  permissionsCount(session: AuthSession): number {
    return session.permissions.length;
  }
}
