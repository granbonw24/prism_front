const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN', 'SUPER_ROOT'] as const;

export function hasWorkflowValidatorRole(
  roles: readonly string[] | null | undefined,
  wanted: readonly string[],
): boolean {
  if (!roles?.length) {
    return false;
  }
  return [...wanted, ...ADMIN_ROLES].some((role) => roles.includes(role));
}

/**
 * L’utilisateur peut valider / rejeter / retourner au palier courant du workflow transversal.
 */
export function canActAsCurrentWorkflowValidator(
  workflowStatus: string | null | undefined,
  roles: readonly string[] | null | undefined,
  hasValidatePermission: boolean,
): boolean {
  if (!hasValidatePermission) {
    return false;
  }
  const status = workflowStatus ?? 'BROUILLON';
  if (status === 'SOUMIS' && hasWorkflowValidatorRole(roles, ['COORDONNATEUR'])) {
    return true;
  }
  if (status === 'VALIDEE_COORDONNATEUR' && hasWorkflowValidatorRole(roles, ['SUPERVISEUR'])) {
    return true;
  }
  if (
    status === 'VALIDEE_SUPERVISEUR'
    && hasWorkflowValidatorRole(roles, ['SUPERVISEUR_AENF', 'DIRECTEUR'])
  ) {
    return true;
  }
  return false;
}

/** Feature RBAC passée à {@code /api/saisie-workflows/retourner|rejeter}. */
export function workflowDecisionFeature(
  workflowStatus: string | null | undefined,
  moduleFeature: string,
  coordFeature?: string | null,
): string {
  if (workflowStatus === 'SOUMIS' && coordFeature?.trim()) {
    return coordFeature.trim();
  }
  return moduleFeature;
}
