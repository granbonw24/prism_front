/**
 * Marque SIM-AENF / MENA CI.
 * Fichiers sous `src/assets/img/...` (URLs Angular : `assets/...`).
 */
export const BRAND_CONFIG = {
  /** Nom affiché de la plateforme (sidebar, titres, exports). */
  platformName: 'SIM-AENF',
  platformSubtitle: 'MENA · Côte d’Ivoire',
  loginTagline:
    'SIM-AENF — suivi des activités éducation / alphabétisation (MENA CI)',
  /** Préfixe des fichiers modèles téléchargeables (import apprenants, etc.). */
  importFilePrefix: 'SIM-AENF',
  /** Illustration / visuel large page login (colonne gauche, ≥ lg). */
  loginPanelSrc: 'assets/img/login.jpg',
  /** Logo institutionnel (sidebar, topbar, au-dessus du formulaire de connexion). */
  markSrc: 'assets/img/logos/logo.jpg',
  alt: 'SIM-AENF — Ministère de l’Éducation Nationale, Côte d’Ivoire',
} as const;
