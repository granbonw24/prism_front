export type VisiteSuiviMode = 'conseiller' | 'superviseur' | 'iepp' | 'centrale';

export type VisiteRef = {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
};

export type VisiteRow = {
  id?: number | null;
  alpha?: VisiteRef | null;
  idAlpha?: number | null;
  maitriseSeanceLecture?: string | null;
  maitriseSeanceEcriture?: string | null;
  maitriseSeanceCalcul?: string | null;
  maitriseSeanceCvc?: string | null;
  nombreVisiteRealiseParConseiller?: number | null;
  nombreBulletinEffectueParConseiller?: number | null;
  nombreVisiteConseillerSuperviseurEffectue?: number | null;
  nombreReunionBilanConseillerSuperviseur?: number | null;
  nombreVisiteEffectueParIepp?: number | null;
  nombreReunionPointActiviteAlpha?: number | null;
  valideeCoordonnateur?: boolean | null;
  valideeIepp?: boolean | null;
  valideeSuperviseur?: boolean | null;
};

export type VisitePayload = {
  mode?: 'points' | VisiteSuiviMode | null;
  idAlpha: number | null;
  maitriseSeanceLecture: string | null;
  maitriseSeanceEcriture: string | null;
  maitriseSeanceCalcul: string | null;
  maitriseSeanceCvc: string | null;
  nombreVisiteRealiseParConseiller: number | null;
  nombreBulletinEffectueParConseiller: number | null;
  nombreVisiteConseillerSuperviseurEffectue: number | null;
  nombreReunionBilanConseillerSuperviseur: number | null;
  nombreVisiteEffectueParIepp: number | null;
  nombreReunionPointActiviteAlpha: number | null;
};
