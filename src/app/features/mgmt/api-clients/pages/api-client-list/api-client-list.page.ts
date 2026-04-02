import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiClientTableComponent } from '../../components/api-client-table/api-client-table.component';
import { SecretClient } from '../../../../../core/models/client';
import { ClientsService } from '../../services/clients.service';

@Component({
  selector: 'app-api-client-list-page',
  standalone: true,
  imports: [ApiClientTableComponent],
  templateUrl: './api-client-list.page.html',
  styleUrl: './api-client-list.page.css',
})
export class ApiClientListPageComponent implements OnInit {
  private readonly clientsService = inject(ClientsService);

  readonly clients = signal<SecretClient[]>([]);
  readonly lastCreated = signal<SecretClient | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadClients();
  }

  createClient(name: string): void {
    const cleanName = name.trim();
    if (!cleanName) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.clientsService.createClient(cleanName).subscribe({
      next: (client) => {
        this.isSaving.set(false);
        this.lastCreated.set(client);
        this.infoMessage.set(`Client creato: ${client.clientId}`);
        this.loadClients();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Impossibile creare il client API.');
      },
    });
  }

  requestDelete(clientId: string): void {
    const confirmed = globalThis.confirm("Confermi l'eliminazione del client selezionato?");
    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.clientsService.deleteClient(clientId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.infoMessage.set('Client eliminato.');
        this.loadClients();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Impossibile eliminare il client API.');
      },
    });
  }

  private loadClients(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.clientsService.getClients().subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.clients.set(rows.map((row) => ({ ...row, clientSecret: '' })));
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossibile caricare i client API.');
      },
    });
  }
}
