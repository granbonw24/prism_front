/**
 * Accueil de l’app Angular, en respectant `<base href>`.
 * Ne pas utiliser `location.replace('/')` : sur le VPS, `/` est un 301 vers DISMAS.
 */
export function appHomeHref(): string {
  const raw = document.querySelector('base')?.getAttribute('href')?.trim();
  return new URL(raw && raw.length > 0 ? raw : '/', window.location.origin).href;
}
