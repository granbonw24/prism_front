/** Champs pour formulaire POST générique (clés = propriétés JSON côté API). */
export type ReferentielFormFieldType = 'text' | 'number' | 'date' | 'checkbox' | 'select';

export interface ReferentielFormField {
  key: string;
  label: string;
  type: ReferentielFormFieldType;
  required?: boolean;
  maxLength?: number;
  /** Source d'options pour les champs `select` (chemin API relatif). */
  optionsApiPath?: string;
  /** Options statiques pour les champs `select` simples. */
  options?: Array<{ value: string | number; label: string }>;
  /** Clé valeur des options (défaut: `id`). */
  optionValueKey?: string;
  /** Clés utilisées pour construire le libellé affiché. */
  optionLabelKeys?: string[];
  /**
   * Pour un champ `select`, envoie `{ id: value }` au lieu de `value` brut.
   * Utile quand l'API attend une relation JPA (ManyToOne) directement.
   */
  payloadAsObjectId?: boolean;
  /** Champ inclus au payload mais non affiché (ex. technique). */
  hidden?: boolean;
  /**
   * Affiché en lecture seule (ex. année scolaire / campagne figée).
   * Le contrôle reste dans le FormGroup pour le payload.
   */
  readOnly?: boolean;
  /**
   * Pour un `select` auto : à l'ouverture en création, sélectionne
   * l'option dont la propriété booléenne vaut `true` (ex. `etatAnneeScolaire` / `etatCampagne`).
   */
  autoSelectFlagKey?: string;
  /**
   * Contrôle d’effectif (formulaires Apprenant densés) :
   * - `total` : saisi en tête ; la somme des `part` doit lui être égale
   * - `part` : rubrique détaillée (incluse dans le compteur live)
   * - `legacyTotal` : total unique historique (H+F), synchronisé au submit, non affiché
   * Si omis, détection par libellé / clé (`Effectif total`, `…NiveauCp`, etc.).
   */
  effectifRole?: 'total' | 'part' | 'legacyTotal';
}
