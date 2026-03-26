import { HttpErrorResponse } from '@angular/common/http';

const MAX_LEN = 480;

function truncate(s: string): string {
  const t = s.trim();
  return t.length > MAX_LEN ? `${t.slice(0, MAX_LEN - 1)}…` : t;
}

/**
 * Texte lisible pour affichage utilisateur à partir d’une erreur HTTP (Spring, JSON, texte brut).
 */
export function formatHttpError(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }
  const body = err.error;
  if (typeof body === 'string' && body.trim()) {
    return truncate(body);
  }
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const o = body as Record<string, unknown>;
    if (typeof o['message'] === 'string' && o['message'].trim()) {
      return truncate(String(o['message']));
    }
    if (typeof o['error'] === 'string' && o['error'].trim()) {
      const msg = String(o['error']).trim();
      return err.status ? `${msg} (HTTP ${err.status})` : msg;
    }
  }
  if (err.status) {
    return `${fallback} (HTTP ${err.status}).`;
  }
  return fallback;
}

/** Résumé court pour toast global (5xx, réseau, 403). */
export function summarizeHttpErrorForToast(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'Serveur injoignable ou problème réseau / CORS.';
  }
  if (err.status === 403) {
    return formatHttpError(err, 'Accès refusé (403).');
  }
  const base = formatHttpError(
    err,
    `Erreur serveur (${err.status ?? '?'})`,
  );
  return base;
}
