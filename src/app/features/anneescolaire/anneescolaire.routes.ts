import { Routes } from '@angular/router';
import { AnneescolaireShellComponent } from '@features/anneescolaire/anneescolaire-shell.component';
import { AnneescolaireListeComponent } from '@features/anneescolaire/liste/anneescolaire.component';
import { AnneescolaireAddComponent } from '@features/anneescolaire/add/add.component';
import { AnneescolaireUpdateComponent } from '@features/anneescolaire/update/update.component';

/** Routes menu Paramétrage → Années scolaires (`/anneescolaire`, `/anneescolaire/add`, …). */
export const anneeScolaireFeatureRoutes: Routes = [
  {
    path: 'anneescolaire',
    component: AnneescolaireShellComponent,
    children: [
      { path: '', component: AnneescolaireListeComponent },
      { path: 'add', component: AnneescolaireAddComponent },
      { path: 'edit/:id', component: AnneescolaireUpdateComponent },
    ],
  },
];
