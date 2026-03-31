import { Component, input } from '@angular/core';
import { ProcessedEnvelope } from '../../../../core/models/measure';

type ChartPoint = {
  sensorId: string;
  value: number;
  widthPct: number;
};

@Component({
  selector: 'app-telemetry-chart',
  standalone: true,
  templateUrl: './telemetry-chart.component.html',
  styleUrl: './telemetry-chart.component.css',
})
export class TelemetryChartComponent {
  readonly measures = input<ProcessedEnvelope[]>([]);

  points(): ChartPoint[] {
    const decrypted = this.measures()
      .filter(
        (row): row is Extract<ProcessedEnvelope, { type: 'decrypted' }> => row.type === 'decrypted',
      )
      .filter((row) => Number.isFinite(row.value))
      .slice(-10);

    const max = decrypted.reduce((acc, row) => Math.max(acc, Math.abs(row.value)), 0);
    if (max <= 0) {
      return [];
    }

    return decrypted.map((row) => ({
      sensorId: row.sensorId,
      value: row.value,
      widthPct: Math.max(6, Math.round((Math.abs(row.value) / max) * 100)),
    }));
  }

  obfuscatedCount(): number {
    return this.measures().filter((row) => row.type === 'obfuscated').length;
  }
}
