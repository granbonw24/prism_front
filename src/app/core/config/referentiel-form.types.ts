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
  /** Clé valeur des options (défaut: `id`). */
  optionValueKey?: string;
  /** Clés utilisées pour construire le libellé affiché. */
  optionLabelKeys?: string[];
  /**
   * Pour un champ `select`, envoie `{ id: value }` au lieu de `value` brut.
   * Utile quand l'API attend une relation JPA (ManyToOne) directement.
   */
  payloadAsObjectId?: boolean;
}
