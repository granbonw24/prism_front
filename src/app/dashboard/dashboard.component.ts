import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { REFERENTIEL_ROUTE_DATA } from '../core/config/referentiel-routes.data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly referentielRoutes = REFERENTIEL_ROUTE_DATA;
}
