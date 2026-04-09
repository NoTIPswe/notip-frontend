import { Component, input, output } from '@angular/core';
import { ThresholdConfig } from '../../../../../core/models/threshold';

export type ThresholdDeletePayload = {
  type: 'sensorId' | 'sensorType';
  key: string;
};

@Component({
  selector: 'app-threshold-table',
  standalone: true,
  templateUrl: './threshold-table.component.html',
  styleUrl: './threshold-table.component.css',
})
export class ThresholdTableComponent {
  readonly thresholds = input<ThresholdConfig[]>([]);
  readonly isLoading = input<boolean>(false);
  readonly canDelete = input<boolean>(true);

  readonly deleteRequested = output<ThresholdDeletePayload>();

  keyOf(row: ThresholdConfig): string {
    return row.type === 'sensorId' ? row.sensorId : row.sensorType;
  }

  scopeOf(row: ThresholdConfig): string {
    return row.type === 'sensorId' ? 'Sensor ID' : 'Sensor Type';
  }

  requestDelete(row: ThresholdConfig): void {
    if (!this.canDelete()) {
      return;
    }

    this.deleteRequested.emit({
      type: row.type,
      key: this.keyOf(row),
    });
  }
}
