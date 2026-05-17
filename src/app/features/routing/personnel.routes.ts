import { Routes } from '@angular/router';
import { PersonnelComponent } from '@features/administration/personnel/personnel.component';

export const personnelFeatureRoutes: Routes = [
  { path: 'personnel', component: PersonnelComponent },
  { path: 'administration/personnel', redirectTo: 'personnel', pathMatch: 'full' },
];
