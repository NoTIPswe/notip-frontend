import { Component, input } from '@angular/core';
import { ProcessedEnvelope } from '../../../../core/models/measure';

@Component({
  selector: 'app-telemetry-table',
  standalone: true,
  templateUrl: './telemetry-table.component.html',
  styleUrl: './telemetry-table.component.css',
})
export class TelemetryTableComponent {
  readonly measures = input<ProcessedEnvelope[]>([]);
  readonly isLoading = input<boolean>(false);

  formatValue(row: ProcessedEnvelope): string {
    if (row.type === 'obfuscated') {
      return '*** OSCURATO ***';
    }

    if (!Number.isFinite(row.value)) {
      return `n/a ${row.unit}`;
    }

    return `${row.value.toFixed(2)} ${row.unit}`;
  }

  rowClass(row: ProcessedEnvelope): string {
    if (row.type === 'decrypted' && row.isOutOfBounds) {
      return 'row-alert';
    }

    return '';
  }
}
