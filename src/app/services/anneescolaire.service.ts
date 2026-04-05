import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '@core/tokens/api-base-url.token';
import type { Anneescolaire } from '@models/anneescolaire';

@Injectable({
  providedIn: 'root',
})
export class AnneescolaireService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpClient,
    @Inject(API_BASE_URL) apiBaseUrl: string,
  ) {
    this.baseUrl = `${apiBaseUrl}/api/anneescolaire`;
  }

  findAll(): Observable<Anneescolaire[]> {
    return this.http.get<Anneescolaire[]>(this.baseUrl);
  }

  findById(id: number): Observable<Anneescolaire> {
    return this.http.get<Anneescolaire>(`${this.baseUrl}/${id}`);
  }

  create(payload: Anneescolaire): Observable<Anneescolaire> {
    return this.http.post<Anneescolaire>(this.baseUrl, payload);
  }

  update(id: number, payload: Anneescolaire): Observable<Anneescolaire> {
    return this.http.put<Anneescolaire>(`${this.baseUrl}/${id}`, payload);
  }

  deleteById(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
