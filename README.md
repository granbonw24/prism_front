# PRISM Front (Angular 17)

Interface web PRISM / DCSPA.

## Prise en main

**[DOCS/PRISE_EN_MAIN.md](DOCS/PRISE_EN_MAIN.md)** — lien vers le guide complet (install, dev local, build staging, déploiement).

**[DOCS/ROADMAP.md](DOCS/ROADMAP.md)** — roadmap d’intégration avec l’API Spring.

## Développement

```bash
npm ci
npm start
```

Navigateur : `http://localhost:4200/` — le backend Spring doit être lancé (`prism`, profil `local`, port 8080).

## Build

```bash
ng build                              # production
ng build --configuration=staging      # VPS : baseHref /dcspa/, apiBaseUrl /dcspa
```

## Tests

```bash
ng test
```

Pour l’aide Angular CLI : `ng help` ou [angular.io/cli](https://angular.io/cli).
