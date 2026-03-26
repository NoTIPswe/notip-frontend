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
            id: this.asString(row['id']),
            name: this.asString(row['name']),
          };

          if (row['created_at']) {
            mapped.createdAt = this.asString(row['created_at']);
          }

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
          id: this.asString(dict['id']),
          name: this.asString(dict['name']),
          clientSecret: this.asString(dict['client_secret']),
        };

        if (dict['created_at']) {
          mapped.createdAt = this.asString(dict['created_at']);
        }

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
}
