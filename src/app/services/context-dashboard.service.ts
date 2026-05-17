import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import { MenuContextDashboard, MenuContextDashboardQuery } from '@models/context-dashboard';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContextDashboardService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  load(query: MenuContextDashboardQuery): Observable<MenuContextDashboard> {
    let params = new HttpParams().set('module', query.module);
    if (query.centreType != null && query.centreType !== '') {
      params = params.set('centreType', query.centreType);
    }
    if (query.centreId != null) {
      params = params.set('centreId', String(query.centreId));
    }
    if (query.subModule) {
      params = params.set('subModule', query.subModule);
    }
    if (query.apiPath) {
      params = params.set('apiPath', query.apiPath);
    }
    return this.http.get<MenuContextDashboard>(`${this.apiBaseUrl}/api/admin/menu-dashboard`, { params });
  }
}
