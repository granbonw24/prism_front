export const environment = {
  production: true,
  /**
   * Même origine logique que le front : les appels vont vers /dcspa/api/… (reverse proxy → Tomcat).
   * Sans slash final (le code ajoute /api/...).
   */
  apiBaseUrl: 'http://154.0.30.233/dcspa',
};
