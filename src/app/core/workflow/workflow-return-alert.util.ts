export type WorkflowReturnAlertItem = {
  resourcePath?: string | null;
  resourceLabel?: string | null;
  recordId?: number | null;
  commentaire?: string | null;
  decidePar?: string | null;
  dateDecision?: string | null;
  proprietaire?: string | null;
};

export type WorkflowReturnAlert = {
  total: number;
  items: WorkflowReturnAlertItem[];
};

export function listPathForWorkflowReturn(resourcePath: string | null | undefined): string {
  switch (resourcePath) {
    case '/api/controle':
      return '/activites-centre/controle';
    case '/api/evaluation':
      return '/activites-centre/evaluation-periodique';
    case '/api/visite':
      return '/activites-centre/visite/conseiller';
    case '/api/performance':
      return '/activites-centre/performance';
    default:
      if (resourcePath?.startsWith('/api/effectif')) {
        return '/apprenant/effectif';
      }
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

export function groupReturnAlertsByModule(items: WorkflowReturnAlertItem[]): WorkflowReturnGroup[] {
  const groups = new Map<string, WorkflowReturnGroup>();
  for (const item of items) {
    const resourcePath = item.resourcePath?.trim() || '/';
    const moduleLabel = item.resourceLabel?.trim() || 'Saisie';
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
