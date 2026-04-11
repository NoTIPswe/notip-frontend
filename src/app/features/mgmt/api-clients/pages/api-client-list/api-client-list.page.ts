import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiClientTableComponent } from '../../components/api-client-table/api-client-table.component';
import { SecretClient } from '../../../../../core/models/client';
import { ClientsService } from '../../services/clients.service';
import { ModalLayerComponent } from '../../../../../shared/components/modal-layer/modal-layer.component';
import { DeleteConfirmModalComponent } from '../../../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';

@Component({
  selector: 'app-api-client-list-page',
  standalone: true,
  imports: [ApiClientTableComponent, ModalLayerComponent, DeleteConfirmModalComponent],
  templateUrl: './api-client-list.page.html',
  styleUrl: './api-client-list.page.css',
})
export class ApiClientListPageComponent implements OnInit {
  private readonly clientsService = inject(ClientsService);

  readonly clients = signal<SecretClient[]>([]);
  readonly lastCreated = signal<SecretClient | null>(null);
  readonly showCreateForm = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly deletingClientId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly formErrorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadClients();
  }

  toggleCreateForm(): void {
    this.errorMessage.set(null);
    this.formErrorMessage.set(null);
    this.showCreateForm.set(!this.showCreateForm());
  }

  closeCreateForm(): void {
    this.errorMessage.set(null);
    this.formErrorMessage.set(null);
    this.showCreateForm.set(false);
  }

  submitCreateForm(event: Event, nameInput: HTMLInputElement): void {
    event.preventDefault();
    this.createClient(nameInput.value, nameInput);
  }

  createClient(name: string, nameInput?: HTMLInputElement): void {
    const cleanName = name.trim();
    if (!cleanName) {
      this.formErrorMessage.set('Client name is required.');
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.formErrorMessage.set(null);
    this.infoMessage.set(null);

    this.clientsService.createClient(cleanName).subscribe({
      next: (client) => {
        this.isSaving.set(false);
        this.showCreateForm.set(false);
        this.lastCreated.set(client);
        this.infoMessage.set(`Client created: ${client.clientId}`);
        if (nameInput) {
          nameInput.value = '';
        }
        this.loadClients();
      },
      error: (error: unknown) => {
        this.isSaving.set(false);
        this.showCreateForm.set(true);
        this.errorMessage.set(null);
        this.formErrorMessage.set(this.resolveCreateClientErrorMessage(error));
      },
    });
  }

  requestDelete(clientId: string): void {
    this.deletingClientId.set(clientId);
  }

  cancelDelete(): void {
    this.deletingClientId.set(null);
  }

  confirmDelete(): void {
    const clientId = this.deletingClientId();
    if (!clientId) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.clientsService.deleteClient(clientId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.deletingClientId.set(null);
        this.infoMessage.set('Client deleted.');
        this.loadClients();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Unable to delete API client.');
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
        this.errorMessage.set('Unable to load API clients.');
      },
    });
  }

  private resolveCreateClientErrorMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Unable to create API client credentials.';
    }

    const payloadMessage = this.pickErrorMessage(error.error);
    if (payloadMessage) {
      return payloadMessage;
    }

    if (typeof error.message === 'string') {
      const trimmed = error.message.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    return 'Unable to create API client credentials.';
  }

  private pickErrorMessage(payload: unknown): string | null {
    if (typeof payload === 'string') {
      const trimmed = payload.trim();
      return trimmed.length > 0 ? trimmed : null;
    }

    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const source = payload as Record<string, unknown>;
    const candidateKeys = ['message', 'error', 'detail', 'title'];

    for (const key of candidateKeys) {
      const value = source[key];
      if (typeof value !== 'string') {
        continue;
      }

      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    return null;
  }
}
