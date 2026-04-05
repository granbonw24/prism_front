/** Aligné sur l'entité Spring `AnneScolaire` / `GET|POST|PUT /api/anneescolaire`. */
export interface Anneescolaire {
  id?: number;
  codeAnneeScolaire?: string | null;
  /** ISO date `yyyy-MM-dd` */
  debutAnneeScolaire?: string | null;
  /** ISO date `yyyy-MM-dd` */
  finAnneeScolaire?: string | null;
  etatAnneeScolaire?: boolean | null;
}
