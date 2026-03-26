/** Champs pour formulaire POST générique (clés = propriétés JSON côté API). */
export type ReferentielFormFieldType = 'text' | 'number' | 'date' | 'checkbox';

export interface ReferentielFormField {
  key: string;
  label: string;
  type: ReferentielFormFieldType;
  required?: boolean;
  maxLength?: number;
}
