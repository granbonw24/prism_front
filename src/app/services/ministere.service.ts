import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ministere } from '../core/models/ministere.model';
import { API_BASE_URL } from '../core/tokens/api-base-url.token';

@Injectable({ providedIn: 'root' })
export class MinistereService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) private readonly apiBaseUrl: string,
  ) {}

  findAll(): Observable<Ministere[]> {
    return this.http.get<Ministere[]>(`${this.apiBaseUrl}/api/ministeres`);
  }

  findById(id: number): Observable<Ministere> {
    return this.http.get<Ministere>(`${this.apiBaseUrl}/api/ministeres/${id}`);
  }

  create(entity: Partial<Ministere>): Observable<Ministere> {
    return this.http.post<Ministere>(
      `${this.apiBaseUrl}/api/ministeres`,
      entity,
    );
  }

  update(id: number, entity: Partial<Ministere>): Observable<Ministere> {
    return this.http.put<Ministere>(
      `${this.apiBaseUrl}/api/ministeres/${id}`,
      entity,
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/api/ministeres/${id}`);
  }
}
