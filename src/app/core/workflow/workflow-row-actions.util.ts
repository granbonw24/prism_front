import type { AuthSession } from '@core/models/auth.models';
import { readWorkflowQueueTab } from '@core/workflow/workflow-queue.util';
import { readWorkflowStatus } from '@core/workflow/workflow-status-display.util';

const VALIDATOR_ROLES = [
  'COORDONNATEUR',
  'IEPP',
  'SUPERVISEUR',
  'SUPERVISEUR_AENF',
  'DIRECTEUR',
  'ADMIN',
  'SUPER_ADMIN',
  'SUPER_ROOT',
] as const;

/** Onglet « Traité / Validé » : consultation seule, pas d'action de modification workflow. */
export function isWorkflowQueueReadOnly(row: Record<string, unknown> | null | undefined): boolean {
  return readWorkflowQueueTab(row ?? {}) === 'TERMINE';
}

export function actsAsWorkflowValidator(session: AuthSession | null | undefined): boolean {
  const roles = session?.roles;
  if (!roles?.length) {
    return false;
  }
  return VALIDATOR_ROLES.some((role) => roles.includes(role));
}

/**
 * Le subordonné peut modifier / resoumettre après un retour validateur.
 * S'appuie sur {@code workflowEditable} API si présent, sinon statuts BROUILLON / RETOURNE.
 */
export function isSubordinateWorkflowEditable(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) {
    return false;
  }
  const editable = row['workflowEditable'];
  if (typeof editable === 'boolean') {
    return editable;
  }
  const st = readWorkflowStatus(row as { workflowStatut?: string | null });
  return st === 'BROUILLON' || st === 'RETOURNE';
}

export function canShowWorkflowMutatingActions(
  row: Record<string, unknown> | null | undefined,
): boolean {
  if (!row || isWorkflowQueueReadOnly(row)) {
    return false;
  }
  return true;
}
