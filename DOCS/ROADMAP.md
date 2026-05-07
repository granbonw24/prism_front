# Roadmap intégration PRISM Front ↔ API Spring

Document de pilotage : **objectifs**, **phases**, **liste des écrans**, et **journal** des avancements.  
**Règle d’équipe** : après chaque lot de travail (feature, correctif majeur), mettre à jour la date en tête, cocher les cases réalisées, et ajouter une entrée dans [Journal des mises à jour](#journal-des-mises-à-jour).

**La roadmap n’est pas mise à jour automatiquement** (pas de hook CI, pas de sync avec Git). Elle reflète l’état réel **uniquement** si quelqu’un l’édite après les livraisons. La date « Dernière mise à jour » en est le repère.

---

## État courant

| Champ | Valeur |
|--------|--------|
| **Dernière mise à jour** | 2026-04-07 |
| **Phase active** | Phase 2–3 — référentiels CRUD + robustesse API ; module Apprenant (effectifs + intégrations) ; placeholders métier (Performance, Visites, etc.) |
| **Prochaine action suggérée** | Prioriser soit **menus placeholder** (brancher API métier ou documenter le périmètre v1), soit **Phase 4** (`environment.prod.ts`, CI). Optionnel : menu filtré par **permissions** (Phase 1.4). |

---

## Définition de « terminé » (projet intégration)

Le chantier est considéré **clos** lorsque :

1. Tous les modules du menu appellent l’API avec succès **ou** l’échec est expliqué (endpoint manquant, entité non sérialisable) et tracé.
2. Là où le backend expose POST/PUT/DELETE, les **formulaires** ou actions CRUD de base sont disponibles (ou explicitement reportés avec raison dans le journal) — **référentiels** : POST/PUT/DELETE via `ReferentielListPageComponent` lorsque `id` est présent dans le JSON liste.
3. **Tableau de bord** : soit branché sur de vraies agrégations/API, soit défini comme « v1 statique » et documenté (**fait pour v1 statique**).
4. **Production** : `environment.prod.ts` renseigné, build documenté, CORS / URL API validés en environnement cible.
5. Aucune dette critique non tracée (fichiers morts, routes cassées).

---

## Conventions — listes paginées centres (Alpha, CEC, CP, SIE)

À répliquer pour toute **nouvelle** liste exposée en API + front sur le même modèle :

| Couche | Règle |
|--------|--------|
| **API** | `GET` renvoie un **`Page`** Spring (`content`, `totalElements`, `totalPages`, `number`, `size`, …) + `Pageable` (`page`, `size`, `sort`). |
| **Filtres** | DTO `@ModelAttribute` avec **un champ par paramètre query** ; côté serveur, **ne pas appliquer** les filtres dont la valeur est vide / null (Specifications + `SpecificationSupport`). |
| **Recherche rapide** | Paramètre **`q`** : recherche **globale** (OR sur colonnes texte pertinentes + égalité **`id`** si `q` est un entier). Les filtres nommés restent combinables en **ET** avec `q`. |
| **Front (listes)** | `HttpParams` : n’envoyer que les clés non vides ; champ UI **« Recherche »** → `q`. Clients qui lisent une liste plate doivent utiliser un **unwrap** (`content` si `Page`). |
| **Postman** | Les requêtes **GET liste** documentent `page`, `size`, `sort`, `q` (et mention des filtres optionnels). Réf. : `prism/postman/PRISM.postman_collection.json`. |
| **Backend (détail)** | `prism/DOCS/ARCHITECTURE-LISTES-CENTRES.md`. |

**Checklist anti-régression** avant merge : compilation Maven + build Angular ; vérifier un écran liste (pagination + recherche `q`) ; vérifier les écrans qui chargent les **options** centres (gros `size` ou endpoint dédié) pour éviter les régressions sur `Page`.

---

## Phase 0 — Fondations (socle applicatif)

| # | Livrable | Statut |
|---|-----------|--------|
| 0.1 | Auth JWT : login, stockage token, `AuthService`, `/api/auth/me` | Fait |
| 0.2 | `HttpClient` + intercepteur `Authorization: Bearer` | Fait |
| 0.3 | Gardes `authGuard` / `guestGuard`, routes shell (menu + main) | Fait |
| 0.4 | `API_BASE_URL` + `src/environments/` (dev + prod) | Fait |
| 0.5 | CORS backend pour origines dev local | Fait |
| 0.6 | Exemple **Ministère** (service dédié + modèle) — remplacé par liste générique commune | Fait (historique) |
| 0.7 | Suppression doublons services inutiles (ex. stub auth dupliqué) | Fait |

---

## Phase 1 — Socle transversal

| # | Livrable | Statut |
|---|-----------|--------|
| 1.1 | Intercepteur HTTP : sur **401** → nettoyage token + session + redirection `/login` | Fait (`unauthorizedInterceptor`) |
| 1.2 | `SessionStore` sans `HttpClient` (évite cycles DI avec intercepteurs) | Fait |
| 1.3 | (Optionnel) Toasts / messages d’erreur API | Fait (`NotificationService` + bandeau shell ; intercepteur 0/403/5xx ; messages détaillés 4xx dans `ReferentielListPageComponent` via `formatHttpError`) |
| 1.4 | (Optionnel) Menu selon `permissions` | À faire |
| 1.5 | Nettoyage fichiers copies (`*copy*`) | Fait (fichiers évidents supprimés) |
| 1.6 | Thème UI vert / orange (inspiration CI), typo Source Sans 3, cohérence sidebar / listes / login | Fait (`styles.css`, menu, login, listes) |

---

## Phase 2 — Référentiels : intégration par module

**Implémentation actuelle** : un composant unique `ReferentielListPageComponent` + `referentiel-routes.data.ts` (titre + `apiPath` + `createFields`). **GET** liste, **POST** (Ajouter), **PUT** `…/apiPath/{id}` (Modifier, formulaire prérempli), **DELETE** `…/apiPath/{id}` (Supprimer, modal de confirmation), dès que la ligne expose un champ `id` et que l’API suit le schéma REST Spring du projet.

Pour **chaque** ligne : la colonne « Liste » est **faite** si l’API répond (données ou liste vide). Les erreurs serveur (500, lazy Hibernate) relèvent de la **Phase 3**.

### Lot A — Priorité métier

| Module | Route | Modèle | Service dédié | Liste | CRUD UI | Notes |
|--------|-------|--------|-----------------|-------|---------|--------|
| Année scolaire | `anneescolaire` | Générique JSON | — | [x] | [x] | Via `referentiel-routes.data` |
| Ministère | `ministere` | Générique JSON | `ministere.service` (optionnel / legacy) | [x] | [~] | POST modal → `MinistereRequest` |
| Document | `document` | Générique JSON | — | [x] | [~] | POST modal → `DocumentRequest` |
| Partenaire | `partenaire` | Générique JSON | — | [x] | [~] | POST modal ; `/api/Partenaires` |

### Lot B — Référentiels généraux

| Module | Route | Liste | CRUD UI |
|--------|-------|-------|---------|
| Autorité autorisation | `autoriteautorisation` | [x] | [x] |
| Catégorie appui | `categorieappui` | [x] | [x] |
| Civilité | `civilite` | [x] | [x] |
| Communauté | `communaute` | [x] | [x] |
| Compétence | `competence` | [x] | [x] |
| Désignation | `designation` | [x] | [x] |
| Difficulté | `difficulte` | [x] | [x] |
| Diplôme | `diplome` | [x] | [x] |
| Domaine activité | `domaineactivite` | [x] | [x] |
| Fonction | `fonction` | [x] | [x] |
| Impact | `impact` | [x] | [x] |
| Infrastructure | `infrastructure` | [x] | [x] |
| Langue apprentissage | `langueapprentissage` | [x] | [x] |
| Matériel alpha | `materielalpha` | [x] | [x] |
| Matériel pédagogique | `materielpedagogique` | [x] | [x] |
| Mode alpha | `modealpha` | [x] | [x] |
| Nature centre | `naturecentre` | [x] | [x] |
| Nature document | `naturedocument` | [x] | [x] |
| Niveau alpha | `niveaualpha` | [x] | [x] |
| Niveau CP | `niveaucp` | [x] | [x] |
| Niveau SIE CEC | `niveausiecec` | [x] | [x] |
| Période activité | `periodeactivite` | [x] | [x] |
| Périodicité | `periodicite` | [x] | [x] |
| Régime alpha | `regimealpha` | [x] | [x] |
| Statut personnel | `statutpersonnel` | [x] | [x] |
| Support didactique | `supportdidactique` | [x] | [x] |
| Type alpha | `typealpha` | [x] | [x] |
| Type document | `typedocument` | [x] | [x] |

### Lot C — Tableau de bord

| Livrable | Statut |
|----------|--------|
| Dashboard v1 statique (thème + mention explicite) | Fait |
| Liens rapide référentiels (badges depuis `REFERENTIEL_ROUTE_DATA`) | Fait |
| Dashboard données réelles | À faire (endpoints métier à définir) |

### Lot D — Navigation & marque

| Livrable | Statut |
|----------|--------|
| Menu **Paramétrage** généré depuis `REFERENTIEL_ROUTE_DATA` (plus de liste en dur / doublons) | Fait |
| Logo institutionnel : `brand.config.ts` — sidebar, login (mobile), topbar, `apple-touch-icon` | Fait |
| Sous-menus **Administration** et **Paramétrage** regroupés par catégories + comportement dropdown | Fait |
| Menu **Promoteurs** branché (liste API) | Fait |

### Lot E — Menus 100% fonctionnels (priorité immédiate)

| Livrable | Statut |
|----------|--------|
| Vérifier que chaque entrée visible du menu ouvre une route valide (pas de page vide / TODO) | Fait |
| Vérifier que chaque route appelle une API existante (GET au minimum) | En cours (Apprenant : effectifs + abandon/handicap/passage/compétences + **intégrations & CEPE** ; reste : sections placeholder) |
| Uniformiser les actions de liste (Détails / Modifier / Supprimer) sur tous les écrans admin | En cours |
| Remplacer les IDs bruts par des libellés métier dans formulaires + tableaux | En cours (effectif dynamique engagé) |
| Règle utilisateur: **un seul rôle** (UI + backend) | Fait |
| Module Apprenant `Effectif` en CRUD complet (GET/POST/PUT/DELETE + formulaire) | Fait |
| `Apprenant > Effectif` unifié : sélection type centre (Alpha/CEC/CP/SIE) + endpoint/formulaire dynamiques | Fait (frontend) |

---

## Phase 3 — Alignement backend & robustesse JSON

| # | Tâche | Statut |
|---|--------|--------|
| 3.1 | Chemins API : source de vérité `referentiel-routes.data.ts` (aligné sur les `@RequestMapping`) | Fait |
| 3.2 | Entités avec relations **lazy** / cycles : `@JsonIgnoreProperties`, DTOs ou `@JsonIgnore` | En cours — effectifs / compétence-centre : JSON **plat** (`Map` + `toRow`) + `JpaAssociationIds` sur les FK (évite `LazyInitializationException` WebFlux + JPA) |
| 3.3 | Tests manuels : login → 2–3 listes + cas 401 (token expiré) | À faire |
| 3.4 | PUT partiel : ne pas écraser les champs **code** `@AutoCode` (null JSON) — `ReferentialPutHelper` + fusions DTO (`Ministere`, `Communaute`, `Document`, `NiveauAlpha`, `ModeAlpha`) | Fait (backend `prism`) |
| 3.5 | WebFlux + JWT : pas de **double** `chain.filter` après succès (`Mono<Void>` + `switchIfEmpty`) — évite erreurs après **204 DELETE** | Fait (`JwtAuthFilter`) |

---

## Phase 4 — Qualité, build, mise en production

| # | Tâche | Statut |
|---|--------|--------|
| 4.1 | `environment.prod.ts` : URL API définitive | À faire |
| 4.2 | Node LTS (18 ou 20) pour CI / équipe | À faire |
| 4.3 | Politique tests : compléter ou retirer les `.spec.ts` générés vides | À faire |
| 4.4 | (Optionnel) Pipeline CI `ng build` + lint | À faire |

---

## Journal des mises à jour

Ajouter **en haut** du tableau (dernier en premier).

| Date | Auteur / contexte | Changement |
|------|-------------------|------------|
| 2026-04-07 | Assistant | **Listes centres** : paramètre API **`q`** (recherche globale OR + id si entier) pour Alpha, CEC, CP, SIE ; UI — champ « Recherche rapide » ; Postman — GET all documentés (`page`, `size`, `sort`, `q`). Roadmap : section **Conventions — listes paginées centres** ; backend : `prism/DOCS/ARCHITECTURE-LISTES-CENTRES.md`. |
| 2026-04-05 | Assistant | **Suite roadmap après tests intégrations** : backend `prism` — utilitaire `JpaAssociationIds` appliqué à **tous** les `toRow` des contrôleurs effectif / compétence-centre (lecture d’id FK sans initialiser les proxies Hibernate). Front déjà livré : écran unifié **Apprenant → Effectif intégrations et CEPE** (`/apprenant/integrations`) + APIs CEPE / admis & formel CP / promu / reverse SIE. **Prochaine étape roadmap** : placeholders (Performance, Control, Visites, Évaluation) ou Phase 4 prod / CI. |
| 2026-04-03 | Assistant | Alignement final avec la regle projet sur les services: recentralisation des services metier (`AdministrationService`, `AnneescolaireService`, `MinistereService`) dans `src/app/services`, recablage des imports des features, suppression des fichiers `features/*/data-access/*.service.ts` pour garantir une source unique des services. |
| 2026-04-03 | Assistant | Normalisation des imports TypeScript vers alias (`@core`, `@models`, `@shared`, `@services`, `@features`) dans `src/app/**/*.ts` avec mise a jour des chemins `tsconfig.json`; compilation front validee apres conversion pour garantir l'absence d'import casse. |
| 2026-04-03 | Assistant | Nettoyage de coherence des services: suppression des services referentiels legacy inutilises dans `src/app/services` et de leurs specs associees; conservation des seuls services transversaux utilises (`auth`, `token-storage`, `session-store`) avec maintien des services metier dans les dossiers `features/*/data-access`. |
| 2026-04-03 | Assistant | Harmonisation des services d'integration: `AdministrationService` et `MinistereService` deplaces de `src/app/services` vers `src/app/features/*/data-access`, imports des composants feature recables, ancien doublon service retire pour garder une source metier unique par feature. |
| 2026-04-03 | Assistant | Migration structure front terminee: pages features actives deplacees sous `src/app/features` (administration, apprenant, centres, dashboard, promoteurs, sections, ministere), dossiers referentiels legacy deplaces sous `src/app/features/referentiels-legacy/*`, imports/routes ajustes sans changement de paths de navigation. |
| 2026-04-03 | Assistant | Harmonisation en lot des modeles vides de `src/app/models` vers un alias partage `ReferentielModel` (`referentiel.model.ts`) ; specs associees migrees de `new Model()` vers des objets types avec assertions de champs. |
| 2026-04-03 | Assistant | **Harmonisation des modèles front** : `Anneescolaire` déplacé de `features/anneescolaire/domain` vers `src/app/models/anneescolaire.ts` (+ spec), imports mis à jour dans la feature. `Ministere` centralisé aussi dans `src/app/models/ministere.ts` (suppression de `core/models/ministere.model.ts`) et services/composants alignés sur le modèle unique. |
| 2026-03-26 | Assistant | **Apprenant Effectif — Alpha niveau** : ajout de la relation backend `EffectifAlpha -> NiveauAlpha` (`ID_NIVEAU_ALPHA`) avec mapping API (`idNiveauAlpha`, `libelleNiveauAlpha`) et ajout du select **Niveau Alpha** dans le formulaire dynamique type `Alpha`. |
| 2026-03-26 | Assistant | **Apprenant Effectif — UX unifiée** : un seul écran `apprenant/effectif` avec sélection du **type de centre** (Alpha/CEC/CP/SIE). Le formulaire et l’endpoint API s’alignent dynamiquement selon le type. Suppression du texte d’aide non souhaité dans la modal formulaire. |
| 2026-03-26 | Assistant | **Module terminé: Apprenant > Effectif (Alpha)**. Backend: `EffectifAlphaController` passe sur DTO dédié `EffectifAlphaRequest` (IDs métier explicites `idPeriodeActivite`, `idCentre`), mapping create/update robuste, liste/détail en sortie lisible (libellés période/centre). Frontend: route `apprenant/effectif` branchée en CRUD complet via `ReferentielListPageComponent` avec formulaire complet (selects + champs quantitatifs). |
| 2026-03-26 | Assistant | **Roadmap — exécution Lot E (menus -> API)** : menu `APPRENANT` branché sur endpoints réels via `ReferentielListPageComponent` (`/api/effectif-alpha`, `/api/effectif-abandon-alpha`, `/api/effectif-passage-alpha`, `/api/effectif-situation-handicap-alpha`, `/api/competence-centre`). Menu `PARTENAIRE` pointe vers la route métier existante `partenaire`. |
| 2026-03-26 | Assistant | **Menus fonctionnels (routing)** : remplacement des liens morts (`utilities-color.html`, `charts.html`) par des routes Angular valides. Ajout des routes opérationnelles pour `Partenaire`, `Apprenant`, `Performance`, `Control`, `Visites`, `Évaluation périodique` avec écran d’atterrissage dédié (`SectionPlaceholderComponent`) pour garantir une navigation sans impasse. |
| 2026-03-26 | Assistant | **Roadmap — prochaine étape menus** : phase active recentrée sur la mise en fonctionnement complète des menus (`Administration`, `Paramétrage`, `Centres`). Ajout d’un **Lot E** pour le suivi opérationnel (routes valides, branchement API, uniformisation actions, libellés lisibles). **Utilisateurs** : contrainte confirmée **1 utilisateur = 1 rôle** appliquée côté backend et UI. |
| 2026-03-26 | Assistant | **Stabilité démarrage** : correction `MenuComponent` (import `RouterLinkActive`) pour lever `NG8002` sur `[routerLinkActiveOptions]`. Vérification des démarrages locaux : frontend `ng serve` opérationnel (`http://localhost:4200`) ; backend Spring actif sur `:8080` (réponse HTTP `401` attendue car API protégée JWT). Roadmap synchronisée avec ce point d’arrêt. |
| 2026-03-26 | Assistant | **Administration** : séparation des écrans **Acteurs (rôles)** (CRUD rôle) et **Rôle permission** (matrice droits). Ajout écran **Personnel (par centre)** : filtre centre + CRUD + KPI total (endpoints dédiés `/api/admin/personnel`). UI: sous-menu actif coloré via `routerLinkActive` + style `.collapse-item.active`. Fix intégration: `/api/fonctions` (remplace `/api/fonction` 404). |
| 2026-03-26 | Assistant | **Administration** : menu ADMINISTRATION avec page dédiée `utilisateurs` (`/administration/utilisateurs`) pour associer les rôles acteur à chaque compte ; backend `GET /api/app-users` + `PUT /api/app-users/{id}/roles` (DTO sans passwordHash). |
| 2026-03-26 | Assistant | **Administration** : menu ADMINISTRATION fonctionnel (liens → `/administration/roles-acteurs`) + page de gestion des droits par acteur via `/api/role-fonctionnalite-permission` (checkbox add/remove). |
| 2026-03-26 | Assistant | **Roadmap** : rappel explicite que le document **n’est pas auto-à-jour** ; ajout Phase **3.4** (PUT + codes `@AutoCode`), **3.5** (`JwtAuthFilter` / 204 DELETE), **Lot D** (menu data-driven, `brand.config.ts`). **Backend** (`prism`) : `AutoCodePutMerge`, `ReferentialPutHelper` sur les PUT entité ; fusions code sur DTO ; correction `switchIfEmpty` après `Mono<Void>` dans le filtre JWT. **Front** : menu Paramétrage = `REFERENTIEL_ROUTE_DATA` ; pastilles référentiels sur le dashboard ; logo `login.jpg` / `markSrc` centralisé (sidebar, login mobile, topbar, `index.html` apple-touch-icon). |
| 2026-03-25 | Assistant | **Feedback HTTP** : `NotificationService` + bandeau dismissible dans `AppShellComponent` ; `apiErrorFeedbackInterceptor` pour **0 / 403 / ≥500** (401 inchangé : `unauthorizedInterceptor`). Utilitaire `formatHttpError` pour charger liste / formulaire / suppression sur `ReferentielListPageComponent`. Tableaux Lot B roadmap : colonne **CRUD UI** alignée sur le composant générique. |
| 2026-03-25 | Assistant | **Listes référentiels** : colonne **Actions** avec **Modifier** (modal, même champs que création, `PUT` sur `{apiPath}/{id}`) et **Supprimer** (confirmation, `DELETE`). Préremplissage depuis la ligne (objets `{ id }` → valeur numérique pour les FK). |
| 2026-03-25 | Assistant | **Format code** : `CodeGeneratorService` produit **7** chiffres après un préfixe 3 lettres (ex. `ALP0000001`). **Préfixe** : mot unique → 3 premières lettres (`alpha`→`ALP`) ; deux segments `_` → 1ʳᵉ lettre du 1ᵉʳ mot + 1ʳᵉ et 2ᵉ du 2ᵉ (`anne_scolaire`→`ASC`) ; 3+ segments → initiales des 3 premiers mots. |
| 2026-03-25 | Assistant | **Codes auto (backend)** : `@AutoCode` + `AutoCodeEntityListener` étendus aux entités référentielles concernées (année scolaire, autorités, catégories, civilités, compétences, documents, ministères/communautés `codePromoteur`, etc.) — format `PRÉFIXE` table (3 lettres) + compteur 7 chiffres (`ALP0000001`, …) via `CodeGeneratorService` / table `code_sequence`. **Front** : champs code retirés des `createFields` ; mention dans la modal de création. |
| 2026-03-25 | Assistant | **Formulaires référentiels** : `createFields` pour document, langue d’apprentissage, matériel alpha, mode alpha, niveau alpha, ministère, communauté. **API** : POST/PUT `LangueApprentissage`, `Communaute`, `Ministere` acceptent désormais des DTO plats (`*Request`) avec `idCentre` / `idPromoteur` + champs scalaires (les clients qui envoyaient l’entité JPA complète doivent migrer). **UI** : valeurs initiales `null` pour champs `number`, payload numériques plus sûrs. |
| 2026-03-25 | Assistant | **Accueil** : rangée de 3 mini-cartes (référentiels, indicateurs à venir, accès JWT) alignée sur le thème orange / menthe ; styles `.mena-mini-card` / `.mena-mini-icon` centralisés dans `styles.css` (réutilisés par les pages référentiels). **Listes** : bouton « Ajouter » + mini-cartes + modal formulaire déjà en place sur `ReferentielListPageComponent` (POST quand `createFields` est défini). |
| 2026-03-25 | Assistant | **Thème MENA CI** (vert institutionnel + accent orange, typo Source Sans 3) ; retrait affichage « Source API » sur les listes ; **backend** `ReferentielDemoDataInitializer` + script `prism/scripts/run-api-avec-donnees-demo.ps1` + doc `prism/DOCS/DONNEES-DEMO.md`. |
| 2026-02-10 | Assistant | **Intégration liste référentiels** : `ReferentielListPageComponent`, `referentiel-routes.data.ts`, routes générées ; intercepteur **401** + `SessionStore` ; auth branché sur `SessionStore` ; bannière dashboard v1 ; suppression fichiers `*copy*` ; roadmap réalignée sur l’implémentation réelle. |
| 2026-02-10 | Assistant / initialisation | Création de la roadmap ; Phase 0–4 définies. |

---

## Comment mettre à jour cette roadmap (checklist rapide)

1. Modifier **Dernière mise à jour** et éventuellement **Phase active** / **Prochaine action** en tête de fichier.
2. Cocher `[x]` ou `[~]` dans les tableaux concernés.
3. Ajouter une ligne au **Journal des mises à jour**.
4. Si un chemin API change côté Spring, modifier **`src/app/core/config/referentiel-routes.data.ts`** et le noter dans le journal.

---

*Fin du document — à faire évoluer jusqu’à satisfaction de la définition de « terminé ».*
