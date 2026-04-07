import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-telemetry-chart',
  standalone: true,
  templateUrl: './telemetry-chart.component.html',
  styleUrl: './telemetry-chart.component.css',
})
export class TelemetryChartComponent implements OnDestroy {
  readonly measures = input<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);
  readonly selectedSensorId = signal<string | null>(null);

  readonly uniqueSensorIds = computed(() => {
    const ids = this.measures()
      .map((m) => m.sensorId)
      .filter((id, index, self) => self.indexOf(id) === index);
    return ids;
  });

  readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chartInstance: Chart | undefined;

  constructor() {
    // Auto-select the first sensor when the list of sensors changes and none is selected
    effect(() => {
      const availableSensors = this.uniqueSensorIds();
      if (availableSensors.length > 0 && !this.selectedSensorId()) {
        this.selectedSensorId.set(availableSensors[0]);
      }
    });

    // Update chart when data or selection changes
    effect(() => {
      const allMeasures = this.measures();
      const selectedId = this.selectedSensorId();
      const canvasRef = this.chartCanvas();

      if (!canvasRef || !selectedId) {
        // If there's no canvas or no sensor selected, we can't do anything.
        // If a chart exists, we can clear it.
        if (this.chartInstance) {
          this.chartInstance.data.labels = [];
          this.chartInstance.data.datasets[0].data = [];
          this.chartInstance.update('none');
        }
        return;
      }

      const canvas = canvasRef.nativeElement;

      const decrypted = allMeasures
        .filter((row): row is CheckedEnvelope => this.isCheckedEnvelope(row))
        .filter((row) => Number.isFinite(row.value) && row.sensorId === selectedId)
        .slice(-50); // Show up to 50 recent points for the selected sensor

      const labels = decrypted.map((d, i) => i); // Use index for x-axis to show progression
      const values = decrypted.map((d) => d.value);

      if (this.chartInstance) {
        this.chartInstance.data.labels = labels;
        this.chartInstance.data.datasets[0].data = values;
        this.chartInstance.update('none');
      } else {
        this.chartInstance = new Chart(canvas, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Valore Decifrato',
                data: values,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#22c55e',
                pointBorderColor: '#fff',
                pointRadius: 4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                grid: {
                  color: '#f1f5f9',
                },
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                  display: false, // Hide x-axis labels for clarity
                },
              },
            },
          },
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  onSensorSelected(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedSensorId.set(selectElement.value);
  }

  obfuscatedCount(): number {
    return this.measures().filter((row) => !this.isCheckedEnvelope(row)).length;
  }

  private isCheckedEnvelope(row: CheckedEnvelope | ObfuscatedEnvelope): row is CheckedEnvelope {
    return 'value' in row;
  }
}
