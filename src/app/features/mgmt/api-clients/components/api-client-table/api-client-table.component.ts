import { Component, input, output } from '@angular/core';
import { Client } from '../../../../../core/models/client';

@Component({
  selector: 'app-api-client-table',
  standalone: true,
  templateUrl: './api-client-table.component.html',
  styleUrl: './api-client-table.component.css',
})
export class ApiClientTableComponent {
  readonly clients = input<Client[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly deleteRequested = output<string>();

  requestDelete(clientId: string): void {
    this.deleteRequested.emit(clientId);
  }
}
