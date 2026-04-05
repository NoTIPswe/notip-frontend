import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClientService as ApiClientApiService } from '../../../../generated/openapi/notip-management-api-openapi';
import { Client, SecretClient } from '../../../../core/models/client';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly apiClientApi = inject(ApiClientApiService);

  getClients(): Observable<Client[]> {
    return this.apiClientApi.apiClientControllerGetApiClients().pipe(
      map((rows) =>
        (rows as Record<string, unknown>[]).map((row) => {
          const mapped: Client = {
            id: this.pickString(row, ['id']),
            clientId: this.pickString(row, ['client_id']),
            name: this.pickString(row, ['name']),
            createdAt: this.pickString(row, ['created_at']),
          };

          return mapped;
        }),
      ),
    );
  }

  createClient(name: string): Observable<SecretClient> {
    return this.apiClientApi.apiClientControllerCreateApiClient({ name }).pipe(
      map((res) => {
        const dict = res as Record<string, unknown>;
        const mapped: SecretClient = {
          id: this.pickString(dict, ['id']),
          clientId: this.pickString(dict, ['client_id']),
          name: this.pickString(dict, ['name']),
          clientSecret: this.pickString(dict, ['client_secret']),
          createdAt: this.pickString(dict, ['created_at']),
        };

        return mapped;
      }),
    );
  }

  deleteClient(clientId: string): Observable<void> {
    return this.apiClientApi.apiClientControllerDeleteApiClient(clientId).pipe(map(() => void 0));
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private pickString(source: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string') {
        return value;
      }
    }

    return '';
  }
}
