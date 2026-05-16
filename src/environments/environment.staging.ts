export const environment = {
  production: true,
  /**
   * Chemin relatif = même hôte/port que le front (ex. :91/dcspa → :91/dcspa/api/…).
   * Comme Dismas (:91/dismas-api/…). Apache proxy /dcspa/api/ → Tomcat :8081/prism/api/.
   * Sans slash final (le code ajoute /api/...).
   */
  apiBaseUrl: '/dcspa',
};
