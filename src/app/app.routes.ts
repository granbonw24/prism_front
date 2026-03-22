import { Routes } from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {LoginComponent} from './login/login.component';
import { AnneescolaireComponent } from './anneescolaire/liste/anneescolaire.component';
import { AutoriteautorisationComponent } from './autoriteautorisation/liste/autoriteautorisation.component';
import { CategorieappuiComponent } from './categorieappui/liste/categorieappui.component';
import { CiviliteComponent } from './civilite/liste/civilite.component';
import { CommunauteComponent } from './communaute/liste/communaute.component';
import { CompetenceComponent } from './competence/liste/competence.component';
import { DesignationComponent } from './designation/liste/designation.component';
import { DifficulteComponent } from './difficulte/liste/difficulte.component';
import { DiplomeComponent } from './diplome/liste/diplome.component';
import { DocumentComponent } from './document/liste/document.component';
import { DomaineactiviteComponent } from './domaineactivite/liste/domaineactivite.component';
import { FonctionComponent } from './fonction/liste/fonction.component';
import { ImpactComponent } from './impact/liste/impact.component';
import { InfrastructureComponent } from './infrastructure/liste/infrastructure.component';
import { LangueapprentissageComponent } from './langueapprentissage/liste/langueapprentissage.component';
import { MaterielalphaComponent } from './materielalpha/liste/materielalpha.component';
import { MaterielpedagogiqueComponent } from './materielpedagogique/liste/materielpedagogique.component';
import { MinistereComponent } from './ministere/liste/ministere.component';
import { ModealphaComponent } from './modealpha/liste/modealpha.component';
import { NaturecentreComponent } from './naturecentre/liste/naturecentre.component';
import { NaturedocumentComponent } from './naturedocument/liste/naturedocument.component';
import { NiveaualphaComponent } from './niveaualpha/liste/niveaualpha.component';
import { NiveaucpComponent } from './niveaucp/liste/niveaucp.component';
import { NiveausiececComponent } from './niveausiecec/liste/niveausiecec.component';
import { PartenaireComponent } from './partenaire/liste/partenaire.component';
import { PeriodeactiviteComponent } from './periodeactivite/liste/periodeactivite.component';
import { PeriodiciteComponent } from './periodicite/liste/periodicite.component';
import { RegimealphaComponent } from './regimealpha/liste/regimealpha.component';
import { StatutpersonnelComponent } from './statutpersonnel/liste/statutpersonnel.component';
import { SupportdidactiqueComponent } from './supportdidactique/liste/supportdidactique.component';
import { TypealphaComponent } from './typealpha/liste/typealpha.component';
import { TypedocumentComponent } from './typedocument/liste/typedocument.component';


export const routes: Routes = [

    {
        path: '',
        component: DashboardComponent
    },

      {
        path: 'anneescolaire',
        component: AnneescolaireComponent
    }
    ,
        {
        path: 'autoriteautorisation',
        component: AutoriteautorisationComponent
    },
        {
        path: 'categorieappui',
        component: CategorieappuiComponent
    },
        {
        path: 'civilite',
        component: CiviliteComponent
    },
        {
        path: 'communaute',
        component: CommunauteComponent
    },
        {
        path: 'competence',
        component: CompetenceComponent
    },
        
        {
        path: 'designation',
        component: DesignationComponent
    },
       {
        path: 'difficulte',
        component: DifficulteComponent
    },
        {
        path: 'diplome',
        component: DiplomeComponent
    },
        {
        path: 'document',
        component: DocumentComponent
    },
        {
        path: 'domaineactivite',
        component: DomaineactiviteComponent
    },
        {
        path: 'fonction',
        component: FonctionComponent
    },
        {
        path: 'impact',
        component: ImpactComponent
    },
        {
        path: 'infrastructure',
        component: InfrastructureComponent
    },
       {
        path: 'langueapprentissage',
        component: LangueapprentissageComponent
    },
        {
        path: 'materielalpha',
        component: MaterielalphaComponent
    },
        {
        path: 'materielpedagogique',
        component: MaterielpedagogiqueComponent
    },
        {
        path: 'ministere',
        component: MinistereComponent
    },
        {
        path: 'modealpha',
        component: ModealphaComponent
    },
        {
        path: 'naturecentre',
        component: NaturecentreComponent
    },
        {
        path: 'naturedocument',
        component: NaturedocumentComponent
    },
       {
        path: 'niveaualpha',
        component: NiveaualphaComponent
    },
        {
        path: 'niveaucp',
        component: NiveaucpComponent
    },
        {
        path: 'niveausiecec',
        component: NiveausiececComponent
    },
        {
        path: 'partenaire',
        component: PartenaireComponent
    },
        {
        path: 'periodeactivite',
        component: PeriodeactiviteComponent
    },
        {
        path: 'periodicite',
        component: PeriodiciteComponent
    },
        {
        path: 'regimealpha',
        component: RegimealphaComponent
    },
      {
        path: 'statutpersonnel',
        component: StatutpersonnelComponent
    },
      {
        path: 'supportdidactique',
        component: SupportdidactiqueComponent
    },
      {
        path: 'typealpha',
        component: TypealphaComponent
    },
      {
        path: 'typedocument',
        component: TypedocumentComponent
    },
       {
        path: 'test',
        component: LoginComponent
        
    }


];
