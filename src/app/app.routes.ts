import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';
import {
  blockIfMustChangePasswordGuard,
  mustChangePasswordPageGuard,
} from '@core/guards/must-change-password.guard';
import { ForcedPasswordChangeComponent } from '@features/auth/forced-password-change.component';
import { mainChildRoutes } from '@features/routing/main-child.routes';
import { AppShellComponent } from './layout/app-shell.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginComponent,
  },
  {
    path: 'changer-mot-de-passe',
    canActivate: [authGuard, mustChangePasswordPageGuard],
    component: ForcedPasswordChangeComponent,
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard, blockIfMustChangePasswordGuard],
    children: [
      {
        path: '',
        component: MainComponent,
        children: mainChildRoutes,
      },
    ],
  },
];
