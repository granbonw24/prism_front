import { Routes } from '@angular/router';
import { AnneescolaireComponent } from './anneescolaire/anneescolaire.component';
import { AutoriteautorisationComponent } from './autoriteautorisation/autoriteautorisation.component';
import { CategorieappuiComponent } from './categorieappui/categorieappui.component';
import { CiviliteComponent } from './civilite/civilite.component';
import { CommunauteComponent } from './communaute/communaute.component';
import { CompetenceComponent } from './competence/competence.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DesignationComponent } from './designation/designation.component';
import { DifficulteComponent } from './difficulte/difficulte.component';
import { DiplomeComponent } from './diplome/diplome.component';
import { DocumentComponent } from './document/document.component';
import { DomaineactiviteComponent } from './domaineactivite/domaineactivite.component';
import { FonctionComponent } from './fonction/fonction.component';
import { ImpactComponent } from './impact/impact.component';
import { InfrastructureComponent } from './infrastructure/infrastructure.component';
import { LangueapprentissageComponent } from './langueapprentissage/langueapprentissage.component';
import { AppShellComponent } from './layout/app-shell.component';
import { LoginComponent } from './login/login.component';
import { MainComponent } from './main/main.component';
import { MaterielalphaComponent } from './materielalpha/materielalpha.component';
import { MaterielpedagogiqueComponent } from './materielpedagogique/materielpedagogique.component';
import { MinistereComponent } from './ministere/ministere.component';
import { ModealphaComponent } from './modealpha/modealpha.component';
import { NaturecentreComponent } from './naturecentre/naturecentre.component';
import { NaturedocumentComponent } from './naturedocument/naturedocument.component';
import { NiveaualphaComponent } from './niveaualpha/niveaualpha.component';
import { NiveaucpComponent } from './niveaucp/niveaucp.component';
import { NiveausiececComponent } from './niveausiecec/niveausiecec.component';
import { PartenaireComponent } from './partenaire/partenaire.component';
import { PeriodeactiviteComponent } from './periodeactivite/periodeactivite.component';
import { PeriodiciteComponent } from './periodicite/periodicite.component';
import { RegimealphaComponent } from './regimealpha/regimealpha.component';
import { StatutpersonnelComponent } from './statutpersonnel/statutpersonnel.component';
import { SupportdidactiqueComponent } from './supportdidactique/supportdidactique.component';
import { TypealphaComponent } from './typealpha/typealpha.component';
import { TypedocumentComponent } from './typedocument/typedocument.component';

/** Routes affichées dans le `<router-outlet>` du `MainComponent` (zone de contenu). */
const mainChildRoutes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'anneescolaire', component: AnneescolaireComponent },
  { path: 'autoriteautorisation', component: AutoriteautorisationComponent },
  { path: 'categorieappui', component: CategorieappuiComponent },
  { path: 'civilite', component: CiviliteComponent },
  { path: 'communaute', component: CommunauteComponent },
  { path: 'competence', component: CompetenceComponent },
  { path: 'designation', component: DesignationComponent },
  { path: 'difficulte', component: DifficulteComponent },
  { path: 'diplome', component: DiplomeComponent },
  { path: 'document', component: DocumentComponent },
  { path: 'domaineactivite', component: DomaineactiviteComponent },
  { path: 'fonction', component: FonctionComponent },
  { path: 'impact', component: ImpactComponent },
  { path: 'infrastructure', component: InfrastructureComponent },
  { path: 'langueapprentissage', component: LangueapprentissageComponent },
  { path: 'materielalpha', component: MaterielalphaComponent },
  { path: 'materielpedagogique', component: MaterielpedagogiqueComponent },
  { path: 'ministere', component: MinistereComponent },
  { path: 'modealpha', component: ModealphaComponent },
  { path: 'naturecentre', component: NaturecentreComponent },
  { path: 'naturedocument', component: NaturedocumentComponent },
  { path: 'niveaualpha', component: NiveaualphaComponent },
  { path: 'niveaucp', component: NiveaucpComponent },
  { path: 'niveausiecec', component: NiveausiececComponent },
  { path: 'partenaire', component: PartenaireComponent },
  { path: 'periodeactivite', component: PeriodeactiviteComponent },
  { path: 'periodicite', component: PeriodiciteComponent },
  { path: 'regimealpha', component: RegimealphaComponent },
  { path: 'statutpersonnel', component: StatutpersonnelComponent },
  { path: 'supportdidactique', component: SupportdidactiqueComponent },
  { path: 'typealpha', component: TypealphaComponent },
  { path: 'typedocument', component: TypedocumentComponent },
];

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    component: LoginComponent,
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: MainComponent,
        children: mainChildRoutes,
      },
    ],
  },
];
