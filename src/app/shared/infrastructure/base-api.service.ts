import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type QueryParams = Record<string, string | number | boolean>;

/** CRUD over one REST resource of the Innova Carty API (`/api/v1/<resource>`). */
export abstract class BaseApiService<T extends { id: string | number }> {
  protected readonly http = inject(HttpClient);
  protected abstract readonly resource: string;

  protected get resourceUrl(): string {
    return `${environment.apiBaseUrl}/${this.resource}`;
  }

  getAll(params: QueryParams = {}): Observable<T[]> {
    return this.http.get<T[]>(this.resourceUrl, { params: new HttpParams({ fromObject: params }) });
  }

  getById(id: T['id']): Observable<T> {
    return this.http.get<T>(`${this.resourceUrl}/${encodeURIComponent(id)}`);
  }

  create(entity: Omit<T, 'id'> | T): Observable<T> {
    return this.http.post<T>(this.resourceUrl, entity);
  }

  update(id: T['id'], changes: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.resourceUrl}/${encodeURIComponent(id)}`, changes);
  }

  delete(id: T['id']): Observable<void> {
    return this.http.delete<void>(`${this.resourceUrl}/${encodeURIComponent(id)}`);
  }
}
