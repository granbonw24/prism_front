export type WorkflowStatusRow = {
  workflowStatut?: string | null;
  workflowStatutLibelle?: string | null;
  workflowDecidePar?: string | null;
  valideeCoordonnateur?: boolean | null;
  valideeSuperviseur?: boolean | null;
  valideeCentrale?: boolean | null;
};

export type WorkflowStatusDisplayOptions = {
  /** Login connecté : libellé « Retourné au conseiller » si l'utilisateur a renvoyé la fiche. */
  username?: string | null;
  validatorView?: boolean;
};

export function readWorkflowStatus(row: WorkflowStatusRow | null | undefined): string | null {
  const raw = row?.workflowStatut;
  if (typeof raw !== 'string' || !raw.trim()) {
    return null;
  }
  return raw.trim();
}

export function workflowStatusLabel(
  row: WorkflowStatusRow | null | undefined,
  options?: WorkflowStatusDisplayOptions,
): string {
  const st = readWorkflowStatus(row);
  if (st === 'RETOURNE') {
    const me = options?.username?.trim();
    const decidePar = row?.workflowDecidePar?.trim();
    if (options?.validatorView && me && decidePar && me === decidePar) {
      return 'Retourné au conseiller';
    }
    return 'Retourné pour correction';
  }
  if (st === 'REJETE') {
    return 'Rejeté';
  }
  if (st === 'SOUMIS') {
    return 'En attente coordonnateur';
  }
  if (st === 'BROUILLON') {
    return 'Brouillon (à soumettre)';
  }
  if (st === 'VALIDEE_CENTRALE' || row?.valideeCentrale) {
    return 'Validé central';
  }
  if (st === 'VALIDEE_SUPERVISEUR' || row?.valideeSuperviseur) {
    return 'Validé superviseur';
  }
  if (st === 'VALIDEE_COORDONNATEUR' || row?.valideeCoordonnateur) {
    return 'Validé coordonnateur';
  }
  const libelle = row?.workflowStatutLibelle?.trim();
  return libelle || '—';
}

function isValidatorReturnToConseiller(
  row: WorkflowStatusRow | null | undefined,
  options?: WorkflowStatusDisplayOptions,
): boolean {
  if (readWorkflowStatus(row) !== 'RETOURNE') {
    return false;
  }
  const me = options?.username?.trim();
  const decidePar = row?.workflowDecidePar?.trim();
  return Boolean(options?.validatorView && me && decidePar && me === decidePar);
}

export function workflowStatusBadgeClass(
  row: WorkflowStatusRow | null | undefined,
  options?: WorkflowStatusDisplayOptions,
): string {
  const st = readWorkflowStatus(row);
  if (st === 'VALIDEE_CENTRALE') {
    return 'badge-success';
  }
  if (st === 'VALIDEE_SUPERVISEUR') {
    return 'badge-primary';
  }
  if (st === 'VALIDEE_COORDONNATEUR') {
    return 'badge-info';
  }
  if (st === 'REJETE') {
    return 'badge-danger';
  }
  if (st === 'RETOURNE') {
    return isValidatorReturnToConseiller(row, options) ? 'badge-danger' : 'badge-warning';
  }
  if (st === 'SOUMIS') {
    return 'badge-secondary';
  }
  if (st === 'BROUILLON') {
    return 'badge-warning';
  }
  return 'badge-secondary';
}
