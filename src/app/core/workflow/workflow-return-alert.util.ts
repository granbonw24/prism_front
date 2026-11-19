export type WorkflowReturnAlertItem = {
  resourcePath?: string | null;
  resourceLabel?: string | null;
  recordCaption?: string | null;
  recordId?: number | null;
  commentaire?: string | null;
  decidePar?: string | null;
  dateDecision?: string | null;
  dateSoumission?: string | null;
  soumisPar?: string | null;
  proprietaire?: string | null;
};

export type WorkflowReturnAlert = {
  total: number;
  items: WorkflowReturnAlertItem[];
};

/** Libellé métier affiché dans la modale « Voir le détail » (type d’effectif ou module). */
export function workflowReturnResourceLabel(resourcePath: string | null | undefined): string {
  const path = resourcePath?.trim() || '';
  if (!path) {
    return 'Saisie';
  }
  const mapped = WORKFLOW_RETURN_RESOURCE_LABELS[path];
  if (mapped) {
    return mapped;
  }
  if (path.startsWith('/api/effectif')) {
    return 'Effectif';
  }
  return 'Saisie';
}

export function workflowReturnItemLabel(item: WorkflowReturnAlertItem): string {
  return item.resourceLabel?.trim() || workflowReturnResourceLabel(item.resourcePath);
}

/** Titre d’une ligne dans la modale alerte (centre / période / code). */
export function workflowReturnItemTitle(item: WorkflowReturnAlertItem): string {
  const caption = item.recordCaption?.trim();
  if (caption) {
    return caption;
  }
  const module = workflowReturnItemLabel(item);
  if (item.recordId != null) {
    return `${module} — n° ${item.recordId}`;
  }
  return module;
}

export function listPathForWorkflowReturn(resourcePath: string | null | undefined): string {
  const path = resourcePath?.trim() || '';
  const mapped = WORKFLOW_RETURN_LIST_PATHS[path];
  if (mapped) {
    return mapped;
  }
  if (path.startsWith('/api/effectif')) {
    if (path.includes('abandon') || path.includes('abondan')) {
      return '/apprenant/abandon';
    }
    if (path.includes('handicap')) {
      return '/apprenant/handicap';
    }
    if (path.includes('passage')) {
      return '/apprenant/passage';
    }
    if (path.includes('promu') && path.includes('cp')) {
      return '/apprenant/centres-promus';
    }
    if (path.includes('cepe')) {
      return '/apprenant/admis-cepe';
    }
    if (path.includes('integration-formel')) {
      return '/apprenant/integres-formel-cp';
    }
    if (path.includes('admis-integration')) {
      return '/apprenant/admis-test-integration-cp';
    }
    if (path.includes('reverse-formel')) {
      return '/apprenant/reverse-formel-sie';
    }
    if (path.includes('promu')) {
      return '/apprenant/centres-promus';
    }
    return '/apprenant/effectif';
  }
  switch (path) {
    case '/api/controle':
      return '/activites-centre/controle';
    case '/api/evaluation':
      return '/activites-centre/evaluation-periodique';
    case '/api/visite':
      return '/activites-centre/visite/conseiller';
    case '/api/performance':
      return '/activites-centre/performance';
    default:
      return '/';
  }
}

export const WORKFLOW_RETURN_DASHBOARD_PREVIEW = 3;

export type WorkflowReturnGroup = {
  moduleLabel: string;
  resourcePath: string;
  listPath: string;
  items: WorkflowReturnAlertItem[];
};

export type WorkflowReturnSummaryEntry = {
  label: string;
  count: number;
};

export function summarizeReturnAlertsByLabel(items: WorkflowReturnAlertItem[]): WorkflowReturnSummaryEntry[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const label = workflowReturnItemLabel(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}

export function groupReturnAlertsByModule(items: WorkflowReturnAlertItem[]): WorkflowReturnGroup[] {
  const groups = new Map<string, WorkflowReturnGroup>();
  for (const item of items) {
    const resourcePath = item.resourcePath?.trim() || '/';
    const moduleLabel = workflowReturnResourceLabel(resourcePath);
    const key = resourcePath;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      continue;
    }
    groups.set(key, {
      moduleLabel,
      resourcePath,
      listPath: listPathForWorkflowReturn(resourcePath),
      items: [item],
    });
  }
  return [...groups.values()].sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel, 'fr'));
}

export function formatReturnAlertDate(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

const WORKFLOW_RETURN_RESOURCE_LABELS: Record<string, string> = {
  '/api/controle': 'Contrôle de centre',
  '/api/evaluation': 'Évaluation périodique',
  '/api/visite': 'Visite conseiller',
  '/api/performance': 'Performance',

  '/api/effectif-alpha': 'Effectif scolarisé (Alpha)',
  '/api/effectif-abandon-alpha': 'Effectif abandon (Alpha)',
  '/api/effectif-passage-alpha': 'Effectif passage (Alpha)',
  '/api/effectif-situation-handicap-alpha': 'Effectif handicap (Alpha)',

  '/api/effectif-cp': 'Effectif scolarisé (CP)',
  '/api/effectif-abandon-cp': 'Effectif abandon (CP)',
  '/api/effectif-cepe-cp': 'Effectif CEPE (CP)',
  '/api/effectif-promu-cp': 'Effectif promu (CP)',
  '/api/effectif-admis-integration-cp': 'Effectif admis intégration (CP)',
  '/api/effectif-integration-formel-cp': 'Effectif intégration formel (CP)',
  '/api/effectif-situation-handicap-cp': 'Effectif handicap (CP)',

  '/api/effectif-cec': 'Effectif scolarisé (CEC)',
  '/api/effectif-abandon-cec': 'Effectif abandon (CEC)',
  '/api/effectif-cepe-cec': 'Effectif CEPE (CEC)',
  '/api/effectif-promu-cec': 'Effectif promu (CEC)',
  '/api/effectif-situation-handicap-cec': 'Effectif handicap (CEC)',

  '/api/effectif-sie': 'Effectif scolarisé (SIE)',
  '/api/effectif-abondan-sie': 'Effectif abandon (SIE)',
  '/api/effectif-promu-sie': 'Effectif promu (SIE)',
  '/api/effectif-reverse-formel-sie': 'Effectif reverse formel (SIE)',
  '/api/effectif-situation-handicap-sie': 'Effectif handicap (SIE)',
};

const WORKFLOW_RETURN_LIST_PATHS: Record<string, string> = {
  '/api/controle': '/activites-centre/controle',
  '/api/evaluation': '/activites-centre/evaluation-periodique',
  '/api/visite': '/activites-centre/visite/conseiller',
  '/api/performance': '/activites-centre/performance',

  '/api/effectif-alpha': '/apprenant/effectif',
  '/api/effectif-abandon-alpha': '/apprenant/abandon',
  '/api/effectif-passage-alpha': '/apprenant/passage',
  '/api/effectif-situation-handicap-alpha': '/apprenant/handicap',

  '/api/effectif-cp': '/apprenant/effectif',
  '/api/effectif-abandon-cp': '/apprenant/abandon',
  '/api/effectif-cepe-cp': '/apprenant/admis-cepe',
  '/api/effectif-promu-cp': '/apprenant/centres-promus',
  '/api/effectif-admis-integration-cp': '/apprenant/admis-test-integration-cp',
  '/api/effectif-integration-formel-cp': '/apprenant/integres-formel-cp',
  '/api/effectif-situation-handicap-cp': '/apprenant/handicap',

  '/api/effectif-cec': '/apprenant/effectif',
  '/api/effectif-abandon-cec': '/apprenant/abandon',
  '/api/effectif-cepe-cec': '/apprenant/admis-cepe',
  '/api/effectif-promu-cec': '/apprenant/centres-promus',
  '/api/effectif-situation-handicap-cec': '/apprenant/handicap',

  '/api/effectif-sie': '/apprenant/effectif',
  '/api/effectif-abondan-sie': '/apprenant/abandon',
  '/api/effectif-promu-sie': '/apprenant/centres-promus',
  '/api/effectif-reverse-formel-sie': '/apprenant/reverse-formel-sie',
  '/api/effectif-situation-handicap-sie': '/apprenant/handicap',
};