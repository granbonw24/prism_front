import { ActivatedRoute, Router } from '@angular/router';
import type { WorkflowQueueTab } from './workflow-queue.util';
import type { WorkflowReturnAlertItem } from './workflow-return-alert.util';

export const WORKFLOW_DEEP_LINK_RECORD_PARAM = 'workflowRecordId';
export const WORKFLOW_DEEP_LINK_TAB_PARAM = 'workflowTab';
export const WORKFLOW_DEEP_LINK_RESOURCE_PARAM = 'workflowResource';

export function workflowReturnCorrectQueryParams(
  item: WorkflowReturnAlertItem,
): Record<string, string> {
  const params: Record<string, string> = { [WORKFLOW_DEEP_LINK_TAB_PARAM]: 'RENVOYE' };
  if (item.recordId != null) {
    params[WORKFLOW_DEEP_LINK_RECORD_PARAM] = String(item.recordId);
  }
  const resource = item.resourcePath?.trim();
  if (resource) {
    params[WORKFLOW_DEEP_LINK_RESOURCE_PARAM] = resource;
  }
  return params;
}

export function readWorkflowDeepLinkRecordId(route: ActivatedRoute): number | null {
  const raw = route.snapshot.queryParamMap.get(WORKFLOW_DEEP_LINK_RECORD_PARAM);
  if (!raw) {
    return null;
  }
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function readWorkflowDeepLinkTab(route: ActivatedRoute): WorkflowQueueTab {
  const raw = route.snapshot.queryParamMap.get(WORKFLOW_DEEP_LINK_TAB_PARAM);
  if (raw === 'ACTION' || raw === 'EN_COURS' || raw === 'TERMINE' || raw === 'RENVOYE') {
    return raw;
  }
  return 'RENVOYE';
}

export function clearWorkflowDeepLinkQueryParams(route: ActivatedRoute, router: Router): void {
  void router.navigate([], {
    relativeTo: route,
    queryParams: {
      [WORKFLOW_DEEP_LINK_RECORD_PARAM]: null,
      [WORKFLOW_DEEP_LINK_TAB_PARAM]: null,
      [WORKFLOW_DEEP_LINK_RESOURCE_PARAM]: null,
    },
    queryParamsHandling: 'merge',
    replaceUrl: true,
  });
}

export type EffectifCentreType = 'alpha' | 'cec' | 'cp' | 'sie';

export function effectifCentreTypeFromResource(resourcePath: string | null | undefined): EffectifCentreType | null {
  const path = resourcePath?.trim() ?? '';
  if (!path.startsWith('/api/effectif')) {
    return null;
  }
  if (path.includes('sie')) {
    return 'sie';
  }
  if (path.includes('cec')) {
    return 'cec';
  }
  if (path.includes('-cp') || path.endsWith('cp') || path.includes('/effectif-cp')) {
    return 'cp';
  }
  if (path.includes('alpha')) {
    return 'alpha';
  }
  return null;
}