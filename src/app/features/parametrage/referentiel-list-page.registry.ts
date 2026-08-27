import type { Type } from '@angular/core';
import { AutoriteAutorisationPageComponent } from './centres-autorisations/autorite-autorisation/autorite-autorisation-page.component';
import { CampagnePageComponent } from './centres-autorisations/campagne/campagne-page.component';
import { CategorieAppuiPageComponent } from './others/categorie-appui/categorie-appui-page.component';
import { CivilitePageComponent } from './others/civilite/civilite-page.component';
import { CommunautePageComponent } from './others/communaute/communaute-page.component';
import { CompetencePageComponent } from './others/competence/competence-page.component';
import { DesignationPageComponent } from './others/designation/designation-page.component';
import { SourceFinancementPageComponent } from './others/source-financement/source-financement-page.component';
import { DifficultePageComponent } from './others/difficulte/difficulte-page.component';
import { DiplomePageComponent } from './others/diplome/diplome-page.component';
import { NiveauPersonnelPageComponent } from './others/niveau-personnel/niveau-personnel-page.component';
import { StructureFormationCertificationPageComponent } from './others/structure-formation-certification/structure-formation-certification-page.component';
import { DocumentPageComponent } from './documents/document/document-page.component';
import { DisciplinePageComponent } from './activites-centre/discipline/discipline-page.component';
import { DomaineActivitePageComponent } from './others/domaine-activite/domaine-activite-page.component';
import { FonctionPageComponent } from './others/fonction/fonction-page.component';
import { RegionPageComponent } from './geographie/region/region-page.component';
import { DrenaPageComponent } from './geographie/drena/drena-page.component';
import { DepartementPageComponent } from './geographie/departement/departement-page.component';
import { DrenaDepartementPageComponent } from './geographie/drena-departement/drena-departement-page.component';
import { IepPageComponent } from './geographie/iep/iep-page.component';
import { SousPrefecturePageComponent } from './geographie/sous-prefecture/sous-prefecture-page.component';
import { CommunePageComponent } from './geographie/commune/commune-page.component';
import { ImpactPageComponent } from './others/impact/impact-page.component';
import { InfrastructurePageComponent } from './others/infrastructure/infrastructure-page.component';
import { MaterielPedagogiquePageComponent } from './pedagogie/materiel-pedagogique/materiel-pedagogique-page.component';
import { LangueApprentissagePageComponent } from './pedagogie/langue-apprentissage/langue-apprentissage-page.component';
import { ManuelPageComponent } from './activites-centre/manuel/manuel-page.component';
import { MinisterePageComponent } from './others/ministere/ministere-page.component';
import { ModeAlphaPageComponent } from './pedagogie/mode-alpha/mode-alpha-page.component';
import { NatureCentrePageComponent } from './centres-autorisations/nature-centre/nature-centre-page.component';
import { NatureDocumentPageComponent } from './documents/nature-document/nature-document-page.component';
import { NiveauAlphaPageComponent } from './pedagogie/niveau-alpha/niveau-alpha-page.component';
import { NiveauCpPageComponent } from './pedagogie/niveau-cp/niveau-cp-page.component';
import { NiveaucontrolePageComponent } from './activites-centre/niveaucontrole/niveaucontrole-page.component';
import { PeriodeevaluationPageComponent } from './activites-centre/periodeevaluation/periodeevaluation-page.component';
import { NiveauevaluationPageComponent } from './activites-centre/niveauevaluation/niveauevaluation-page.component';
import { ThemeevaluationPageComponent } from './activites-centre/themeevaluation/themeevaluation-page.component';
import { AspectaameliorerPageComponent } from './activites-centre/aspectaameliorer/aspectaameliorer-page.component';
import { NiveauSieCecPageComponent } from './pedagogie/niveau-sie-cec/niveau-sie-cec-page.component';
import { PartenairePageComponent } from './others/partenaire/partenaire-page.component';
import { PeriodeActivitePageComponent } from './others/periode-activite/periode-activite-page.component';
import { EcoleTutricePageComponent } from './others/ecole-tutrice/ecole-tutrice-page.component';
import { OrganisationFaitierePageComponent } from './others/organisation-faitiere/organisation-faitiere-page.component';
import { PeriodicitePageComponent } from './centres-autorisations/periodicite/periodicite-page.component';
import { RegimeAlphaPageComponent } from './pedagogie/regime-alpha/regime-alpha-page.component';
import { CategorieCentreAlphaPageComponent } from './pedagogie/categorie-centre-alpha/categorie-centre-alpha-page.component';
import { StatutPersonnelPageComponent } from './others/statut-personnel/statut-personnel-page.component';
import { SupportDidactiquePageComponent } from './pedagogie/support-didactique/support-didactique-page.component';
import { TypeAlphaPageComponent } from './pedagogie/type-alpha/type-alpha-page.component';
import { TypeSiePageComponent } from './pedagogie/type-sie/type-sie-page.component';
import { TypeDocumentPageComponent } from './documents/type-document/type-document-page.component';
import { MilieuImplantationPageComponent } from './geographie/milieu-implantation/milieu-implantation-page.component';
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
  "source-financement": SourceFinancementPageComponent,
  "difficulte": DifficultePageComponent,
  "diplome": DiplomePageComponent,
  "niveau-personnel": NiveauPersonnelPageComponent,
  "structure-formation-certification": StructureFormationCertificationPageComponent,
  "document": DocumentPageComponent,
  "discipline": DisciplinePageComponent,
  "domaineactivite": DomaineActivitePageComponent,
  "fonction": FonctionPageComponent,
  "region": RegionPageComponent,
  "drena": DrenaPageComponent,
  "departement": DepartementPageComponent,
  "drena-departement": DrenaDepartementPageComponent,
  "iep": IepPageComponent,
  "sous-prefecture": SousPrefecturePageComponent,
  "commune": CommunePageComponent,
  "impact": ImpactPageComponent,
  "infrastructure": InfrastructurePageComponent,
  "materielpedagogique": MaterielPedagogiquePageComponent,
  "langue-apprentissage": LangueApprentissagePageComponent,
  "manuel": ManuelPageComponent,
  "ministere": MinisterePageComponent,
  "modealpha": ModeAlphaPageComponent,
  "naturecentre": NatureCentrePageComponent,
  "naturedocument": NatureDocumentPageComponent,
  "niveaualpha": NiveauAlphaPageComponent,
  "niveaucp": NiveauCpPageComponent,
  "niveaucontrole": NiveaucontrolePageComponent,
  "periodeevaluation": PeriodeevaluationPageComponent,
  "niveauevaluation": NiveauevaluationPageComponent,
  "themeevaluation": ThemeevaluationPageComponent,
  "aspectaameliorer": AspectaameliorerPageComponent,
  "niveausiecec": NiveauSieCecPageComponent,
  "partenaire": PartenairePageComponent,
  "periodeactivite": PeriodeActivitePageComponent,
  "ecole-tutrice": EcoleTutricePageComponent,
  "organisation-faitiere": OrganisationFaitierePageComponent,
  "periodicite": PeriodicitePageComponent,
  "regimealpha": RegimeAlphaPageComponent,
  "categorie-centre-alpha": CategorieCentreAlphaPageComponent,
  "statutpersonnel": StatutPersonnelPageComponent,
  "supportdidactique": SupportDidactiquePageComponent,
  "typealpha": TypeAlphaPageComponent,
  "typesie": TypeSiePageComponent,
  "typedocument": TypeDocumentPageComponent,
  "milieu-implantation": MilieuImplantationPageComponent,
  "localite-d-implantation": LocaliteDImplantationPageComponent,
};
