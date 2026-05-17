# PRISM Front — Prise en main

Le guide **complet** (backend, BDD, déploiement VPS, dépannage `npm ci` / OneDrive) est dans le dépôt API :

**[../../prism/DOCS/PRISE_EN_MAIN.md](../../prism/DOCS/PRISE_EN_MAIN.md)**

## Commandes essentielles (ce dépôt)

```powershell
npm ci          # après clone ; arrêter ng serve si EPERM sur esbuild.exe
npm start       # http://localhost:4200 — API : environment.ts → localhost:8080
npm run build -- --configuration=staging   # déploiement /dcspa/
```

## Autre documentation

- [ROADMAP.md](ROADMAP.md) — intégration front ↔ API, phases, journal
- [README.md](../README.md) — rappel Angular CLI
