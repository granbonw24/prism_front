export type VisiteSuiviMode = 'conseiller' | 'superviseur' | 'iepp' | 'centrale';

export type VisiteRef = {
  id?: number | null;
  code?: string | null;
  libelle?: string | null;
};

export type VisiteRow = {
  id?: number | null;
  alpha?: VisiteRef | null;
  periodeActivite?: VisiteRef | null;
  niveauAlpha?: VisiteRef | null;
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
  /** Renseignés après fusion avec `/api/saisie-workflows/statuses` (mode conseiller / points). */
  workflowStatut?: string | null;
  workflowStatutLibelle?: string | null;
  workflowEditable?: boolean | null;
  workflowMotifRejet?: string | null;
  workflowCommentaireRetour?: string | null;
  workflowSoumisPar?: string | null;
  workflowProprietaire?: string | null;
};

export type VisitePayload = {
  mode?: 'points' | VisiteSuiviMode | null;
  idAlpha: number | null;
  idPeriodeActivite: number | null;
  idNiveauAlpha: number | null;
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
