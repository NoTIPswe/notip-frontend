import { Component, input } from '@angular/core';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';

@Component({
  selector: 'app-telemetry-table',
  standalone: true,
  templateUrl: './telemetry-table.component.html',
  styleUrl: './telemetry-table.component.css',
})
export class TelemetryTableComponent {
  readonly measures = input<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);
  readonly isLoading = input<boolean>(false);

  formatValue(row: CheckedEnvelope | ObfuscatedEnvelope): string {
    if (!this.isCheckedEnvelope(row)) {
      return '*** OSCURATO ***';
    }

    if (!Number.isFinite(row.value)) {
      return `n/a ${row.unit}`;
    }

    return `${row.value.toFixed(2)} ${row.unit}`;
  }

  rowClass(row: CheckedEnvelope | ObfuscatedEnvelope): string {
    if (this.isCheckedEnvelope(row) && row.isOutofBounds) {
      return 'row-alert';
    }

    return '';
  }

  private isCheckedEnvelope(row: CheckedEnvelope | ObfuscatedEnvelope): row is CheckedEnvelope {
    return 'value' in row;
  }
}
