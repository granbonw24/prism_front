/** Délai standard avant envoi d'une recherche texte vers l'API (saisie utilisateur peu rapide). */
export const MENA_LIST_SEARCH_DEBOUNCE_MS = 2000;

/** Debounce partagé pour les champs « recherche texte → requête API ». */
export class MenaListSearchDebouncer {
  private handle: ReturnType<typeof setTimeout> | null = null;

  schedule(action: () => void, delayMs = MENA_LIST_SEARCH_DEBOUNCE_MS): void {
    this.cancel();
    this.handle = setTimeout(() => {
      this.handle = null;
      action();
    }, delayMs);
  }

  cancel(): void {
    if (this.handle != null) {
      clearTimeout(this.handle);
      this.handle = null;
    }
  }

  /** Entrée clavier ou bouton Filtrer : exécution immédiate. */
  runNow(action: () => void): void {
    this.cancel();
    action();
  }
}
