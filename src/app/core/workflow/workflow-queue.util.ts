import type { AuthSession } from '@core/models/auth.models';

export type WorkflowQueueTab = 'ACTION' | 'EN_COURS' | 'TERMINE';

export type WorkflowQueueTabLabels = Record<WorkflowQueueTab, string>;

const VALIDATOR_ROLES = [
  'COORDONNATEUR',
  'SUPERVISEUR',
  'SUPERVISEUR_AENF',
  'DIRECTEUR',
  'IEPP',
  'ADMIN',
  'SUPER_ADMIN',
  'SUPER_ROOT',
];

export function workflowQueueTabLabels(session: AuthSession | null): WorkflowQueueTabLabels {
  const conseillerView =
    !!session?.roles?.includes('CONSEILLER') &&
    !session.roles.some((r) => VALIDATOR_ROLES.includes(r));
  if (conseillerView) {
    return {
      ACTION: 'À soumettre',
      EN_COURS: 'En attente de validation',
      TERMINE: 'Validé',
    };
  }
  return {
    ACTION: 'À valider',
    EN_COURS: 'À venir',
    TERMINE: 'Déjà validé par moi',
  };
}

export function readWorkflowQueueTab(row: Record<string, unknown>): WorkflowQueueTab | null {
  const raw = row['workflowOnglet'];
  if (raw === 'ACTION' || raw === 'EN_COURS' || raw === 'TERMINE') {
    return raw;
  }
  return classifyWorkflowTabFallback(row);
}

/** Repli client si l’API n’a pas encore renvoyé workflowOnglet. */
function classifyWorkflowTabFallback(row: Record<string, unknown>): WorkflowQueueTab {
  const st = String(row['workflowStatut'] ?? 'BROUILLON');
  switch (st) {
    case 'BROUILLON':
    case 'RETOURNE':
      return 'ACTION';
    case 'SOUMIS':
      return 'EN_COURS';
    default:
      return 'TERMINE';
  }
}

export function rowMatchesWorkflowTab(
  row: Record<string, unknown>,
  tab: WorkflowQueueTab,
): boolean {
  return readWorkflowQueueTab(row) === tab;
}

export function countByWorkflowTab(
  rows: Record<string, unknown>[],
): Record<WorkflowQueueTab, number> {
  const counts: Record<WorkflowQueueTab, number> = {
    ACTION: 0,
    EN_COURS: 0,
    TERMINE: 0,
  };
  for (const row of rows) {
    const tab = readWorkflowQueueTab(row);
    if (tab) {
      counts[tab] += 1;
    }
  }
  return counts;
}

/** Identifiant centre (Alpha) pour filtre — plusieurs clés possibles selon l’API. */
export function resolveRowCentreId(row: Record<string, unknown>): number | null {
  const alpha = row['alpha'] as { id?: number; idCentre?: number } | null | undefined;
  if (alpha?.idCentre != null) {
    return Number(alpha.idCentre);
  }
  if (alpha?.id != null) {
    return Number(alpha.id);
  }
  const direct =
    row['idAlpha'] ?? row['idCentre'] ?? row['id_alpha'] ?? row['id_centre'];
  if (direct == null || direct === '') {
    return null;
  }
  const n = Number(direct);
  return Number.isFinite(n) ? n : null;
}

export function resolveRowConseillerLogin(row: Record<string, unknown>): string | null {
  const prop = row['workflowProprietaire'];
  const soum = row['workflowSoumisPar'];
  if (typeof prop === 'string' && prop.trim()) {
    return prop.trim();
  }
  if (typeof soum === 'string' && soum.trim()) {
    return soum.trim();
  }
  return null;
}

export function collectConseillerFilterOptions(
  rows: Record<string, unknown>[],
): Array<{ value: string; label: string }> {
  const logins = new Set<string>();
  for (const row of rows) {
    const login = resolveRowConseillerLogin(row);
    if (login) {
      logins.add(login);
    }
  }
  return [...logins]
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map((value) => ({ value, label: value }));
}
