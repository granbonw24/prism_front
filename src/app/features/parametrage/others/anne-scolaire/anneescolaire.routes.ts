import { Routes } from '@angular/router';
import { AnneescolaireShellComponent } from '@features/parametrage/others/anne-scolaire/anneescolaire-shell.component';
import { AnneescolaireListeComponent } from '@features/parametrage/others/anne-scolaire/liste/anneescolaire.component';
import { AnneescolaireAddComponent } from '@features/parametrage/others/anne-scolaire/add/add.component';
import { AnneescolaireUpdateComponent } from '@features/parametrage/others/anne-scolaire/update/update.component';

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
