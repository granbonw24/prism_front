import type { AuthSession } from '@core/models/auth.models';

export type WorkflowQueueTab = 'ACTION' | 'EN_COURS' | 'TERMINE' | 'RENVOYE';

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
      RENVOYE: 'Renvoyé pour modification',
    };
  }
  return {
    ACTION: 'En attente',
    EN_COURS: 'À venir',
    TERMINE: 'Traité',
    RENVOYE: 'Renvoyé pour modification',
  };
}

export function readWorkflowQueueTab(row: Record<string, unknown>): WorkflowQueueTab | null {
  const raw = row['workflowOnglet'];
  if (raw === 'ACTION' || raw === 'EN_COURS' || raw === 'TERMINE' || raw === 'RENVOYE') {
    return raw;
  }
  return classifyWorkflowTabFallback(row);
}

/** Repli client si l’API n’a pas encore renvoyé workflowOnglet. */
function classifyWorkflowTabFallback(row: Record<string, unknown>): WorkflowQueueTab {
  const st = String(row['workflowStatut'] ?? 'BROUILLON');
  switch (st) {
    case 'BROUILLON':
      return 'ACTION';
    case 'RETOURNE':
      return 'RENVOYE';
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
    RENVOYE: 0,
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

export function workflowDecisionTooltip(
  row: { workflowMotifRejet?: string | null; workflowCommentaireRetour?: string | null },
  fallback: string,
): string {
  const motif = row.workflowMotifRejet?.trim();
  if (motif) {
    return `Motif rejet : ${motif}`;
  }
  const commentaire = row.workflowCommentaireRetour?.trim();
  if (commentaire) {
    return `Commentaire retour : ${commentaire}`;
  }
  return fallback;
}

export function resolveRowConseillerLogin(row: Record<string, unknown>): string | null {
  for (const key of ['enregistrePar', 'workflowProprietaire', 'workflowSoumisPar']) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

export function collectConseillerFilterOptions(
  rows: Record<string, unknown>[],
): Array<{ value: string; label: string }> {
  const labels = new Map<string, string>();
  for (const row of rows) {
    const login = resolveRowConseillerLogin(row);
    if (!login) {
      continue;
    }
    const nom = typeof row['conseillerNom'] === 'string' ? row['conseillerNom'].trim() : '';
    const previous = labels.get(login);
    if (!previous || previous === login) {
      labels.set(login, nom || login);
    }
  }
  return [...labels.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], 'fr'))
    .map(([value, label]) => ({ value, label }));
}
