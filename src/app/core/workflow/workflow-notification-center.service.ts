import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import type { AuthSession } from '@core/models/auth.models';
import { TokenStorageService } from '@services/token-storage.service';
import { BehaviorSubject, Observable, catchError, map, of } from 'rxjs';
import { workflowReturnCorrectQueryParams } from './workflow-deep-link.util';
import {
  listPathForWorkflowReturn,
  workflowReturnItemTitle,
  type WorkflowReturnAlert,
  type WorkflowReturnAlertItem,
} from './workflow-return-alert.util';

export type WorkflowNotificationKind = 'return' | 'pending';

export type WorkflowNotificationEntry = {
  kind: WorkflowNotificationKind;
  title: string;
  subtitle: string;
  listPath: string;
  queryParams: Record<string, string>;
};

export type WorkflowNotificationSnapshot = {
  total: number;
  returns: WorkflowReturnAlert;
  pending: WorkflowReturnAlert;
  entries: WorkflowNotificationEntry[];
};

const EMPTY_ALERT: WorkflowReturnAlert = { total: 0, items: [] };

const VALIDATOR_ROLES = new Set([
  'COORDONNATEUR',
  'IEPP',
  'SUPERVISEUR',
  'SUPERVISEUR_AENF',
  'DIRECTEUR',
]);

const ADMIN_ONLY_ROLES = new Set(['ADMIN', 'SUPER_ADMIN', 'SUPER_ROOT']);

type DashboardAlerts = {
  workflowReturns?: WorkflowReturnAlert;
  workflowPending?: WorkflowReturnAlert;
};

@Injectable({ providedIn: 'root' })
export class WorkflowNotificationCenterService {
  private readonly snapshot$ = new BehaviorSubject<WorkflowNotificationSnapshot>(emptySnapshot());

  constructor(
    private readonly http: HttpClient,
    private readonly tokens: TokenStorageService,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  observe(): Observable<WorkflowNotificationSnapshot> {
    return this.snapshot$.asObservable();
  }

  refresh(): void {
    this.fetchSnapshot().subscribe((snap) => this.snapshot$.next(snap));
  }

  /** Alimente la cloche sans second appel HTTP (ex. après chargement du TDB). */
  applyFromDashboard(body: DashboardAlerts): void {
    this.snapshot$.next(this.buildSnapshot(body));
  }

  canReceiveWorkflowNotifications(session: AuthSession | null): boolean {
    if (!session?.roles?.length) {
      return false;
    }
    const roles = session.roles;
    const conseillerOnly =
      roles.includes('CONSEILLER') && !roles.some((r) => VALIDATOR_ROLES.has(r) || ADMIN_ONLY_ROLES.has(r));
    if (conseillerOnly) {
      return true;
    }
    return roles.some((r) => VALIDATOR_ROLES.has(r));
  }

  private fetchSnapshot(): Observable<WorkflowNotificationSnapshot> {
    if (!this.tokens.getAccessToken()) {
      return of(emptySnapshot());
    }
    return this.http.get<DashboardAlerts>(`${this.apiBaseUrl}/api/admin/dashboard`).pipe(
      map((body) => this.buildSnapshot(body)),
      catchError(() => of(emptySnapshot())),
    );
  }

  private buildSnapshot(body: DashboardAlerts): WorkflowNotificationSnapshot {
    const returns = normalizeAlert(body.workflowReturns);
    const pending = normalizeAlert(body.workflowPending);
    const entries: WorkflowNotificationEntry[] = [];

    for (const item of returns.items) {
      entries.push(toEntry('return', item));
    }
    for (const item of pending.items) {
      const params = { ...workflowReturnCorrectQueryParams(item), workflowTab: 'ACTION' };
      entries.push({
        kind: 'pending',
        title: workflowReturnItemTitle(item),
        subtitle: 'En attente de votre validation',
        listPath: listPathForWorkflowReturn(item.resourcePath),
        queryParams: params,
      });
    }

    entries.sort((a, b) => a.title.localeCompare(b.title, 'fr'));

    return {
      total: returns.total + pending.total,
      returns,
      pending,
      entries: entries.slice(0, 12),
    };
  }
}

function toEntry(kind: 'return', item: WorkflowReturnAlertItem): WorkflowNotificationEntry {
  const decide = item.decidePar?.trim();
  const subtitle = decide
    ? `Renvoyée — retour par ${decide}`
    : 'Renvoyée pour correction';
  return {
    kind,
    title: workflowReturnItemTitle(item),
    subtitle,
    listPath: listPathForWorkflowReturn(item.resourcePath),
    queryParams: workflowReturnCorrectQueryParams(item),
  };
}

function normalizeAlert(raw: WorkflowReturnAlert | undefined): WorkflowReturnAlert {
  if (!raw) {
    return EMPTY_ALERT;
  }
  const items = raw.items ?? [];
  return {
    total: raw.total ?? items.length,
    items,
  };
}

function emptySnapshot(): WorkflowNotificationSnapshot {
  return {
    total: 0,
    returns: EMPTY_ALERT,
    pending: EMPTY_ALERT,
    entries: [],
  };
}