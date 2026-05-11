import type { Type } from '@angular/core';
import { AutoriteAutorisationPageComponent } from './centres-autorisations/autorite-autorisation/autorite-autorisation-page.component';
import { CampagnePageComponent } from './centres-autorisations/campagne/campagne-page.component';
import { CategorieAppuiPageComponent } from './others/categorie-appui/categorie-appui-page.component';
import { CivilitePageComponent } from './others/civilite/civilite-page.component';
import { CommunautePageComponent } from './others/communaute/communaute-page.component';
import { CompetencePageComponent } from './others/competence/competence-page.component';
import { DesignationPageComponent } from './others/designation/designation-page.component';
import { DifficultePageComponent } from './others/difficulte/difficulte-page.component';
import { DiplomePageComponent } from './others/diplome/diplome-page.component';
import { DocumentPageComponent } from './documents/document/document-page.component';
import { DomaineActivitePageComponent } from './others/domaine-activite/domaine-activite-page.component';
import { FonctionPageComponent } from './others/fonction/fonction-page.component';
import { ImpactPageComponent } from './others/impact/impact-page.component';
import { InfrastructurePageComponent } from './others/infrastructure/infrastructure-page.component';
import { LangueApprentissagePageComponent } from './pedagogie/langue-apprentissage/langue-apprentissage-page.component';
import { MaterielAlphaPageComponent } from './pedagogie/materiel-alpha/materiel-alpha-page.component';
import { MaterielPedagogiquePageComponent } from './pedagogie/materiel-pedagogique/materiel-pedagogique-page.component';
import { MinisterePageComponent } from './others/ministere/ministere-page.component';
import { ModeAlphaPageComponent } from './pedagogie/mode-alpha/mode-alpha-page.component';
import { NatureCentrePageComponent } from './centres-autorisations/nature-centre/nature-centre-page.component';
import { NatureDocumentPageComponent } from './documents/nature-document/nature-document-page.component';
import { NiveauAlphaPageComponent } from './pedagogie/niveau-alpha/niveau-alpha-page.component';
import { NiveauCpPageComponent } from './pedagogie/niveau-cp/niveau-cp-page.component';
import { NiveauSieCecPageComponent } from './pedagogie/niveau-sie-cec/niveau-sie-cec-page.component';
import { PartenairePageComponent } from './others/partenaire/partenaire-page.component';
import { PeriodeActivitePageComponent } from './others/periode-activite/periode-activite-page.component';
import { PeriodicitePageComponent } from './centres-autorisations/periodicite/periodicite-page.component';
import { RegimeAlphaPageComponent } from './pedagogie/regime-alpha/regime-alpha-page.component';
import { StatutPersonnelPageComponent } from './others/statut-personnel/statut-personnel-page.component';
import { SupportDidactiquePageComponent } from './pedagogie/support-didactique/support-didactique-page.component';
import { TypeAlphaPageComponent } from './pedagogie/type-alpha/type-alpha-page.component';
import { TypeDocumentPageComponent } from './documents/type-document/type-document-page.component';
import { LocaliteDImplantationPageComponent } from './geographie/localite-d-implantation/localite-d-implantation-page.component';

/**
 * Associe le segment d’URL (`ReferentielRouteData.path`) au composant page dédié.
 * Régénération : `node tools/gen-referentiel-wrappers.mjs`
 */
export const REFERENTIEL_LIST_PAGE_BY_PATH: Record<string, Type<unknown>> = {
  "autoriteautorisation": AutoriteAutorisationPageComponent,
  "campagne": CampagnePageComponent,
  "categorieappui": CategorieAppuiPageComponent,
  "civilite": CivilitePageComponent,
  "communaute": CommunautePageComponent,
  "competence": CompetencePageComponent,
  "designation": DesignationPageComponent,
  "difficulte": DifficultePageComponent,
  "diplome": DiplomePageComponent,
  "document": DocumentPageComponent,
  "domaineactivite": DomaineActivitePageComponent,
  "fonction": FonctionPageComponent,
  "impact": ImpactPageComponent,
  "infrastructure": InfrastructurePageComponent,
  "langueapprentissage": LangueApprentissagePageComponent,
  "materielalpha": MaterielAlphaPageComponent,
  "materielpedagogique": MaterielPedagogiquePageComponent,
  "ministere": MinisterePageComponent,
  "modealpha": ModeAlphaPageComponent,
  "naturecentre": NatureCentrePageComponent,
  "naturedocument": NatureDocumentPageComponent,
  "niveaualpha": NiveauAlphaPageComponent,
  "niveaucp": NiveauCpPageComponent,
  "niveausiecec": NiveauSieCecPageComponent,
  "partenaire": PartenairePageComponent,
  "periodeactivite": PeriodeActivitePageComponent,
  "periodicite": PeriodicitePageComponent,
  "regimealpha": RegimeAlphaPageComponent,
  "statutpersonnel": StatutPersonnelPageComponent,
  "supportdidactique": SupportDidactiquePageComponent,
  "typealpha": TypeAlphaPageComponent,
  "typedocument": TypeDocumentPageComponent,
  "localite-d-implantation": LocaliteDImplantationPageComponent,
};
