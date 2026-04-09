import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnDestroy,
  viewChild,
} from '@angular/core';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const MAX_CHART_POINTS = 120;
const SERIES_COLORS = [
  '#0ea5e9',
  '#f97316',
  '#22c55e',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
  '#f59e0b',
];

@Component({
  selector: 'app-telemetry-chart',
  standalone: true,
  templateUrl: './telemetry-chart.component.html',
  styleUrl: './telemetry-chart.component.css',
})
export class TelemetryChartComponent implements OnDestroy {
  readonly measures = input<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);
  readonly decryptedMeasures = computed(() =>
    this.measures()
      .filter((row): row is CheckedEnvelope => this.isCheckedEnvelope(row))
      .filter((row) => Number.isFinite(row.value)),
  );

  readonly uniqueCheckedSensorIds = computed(() =>
    Array.from(new Set(this.decryptedMeasures().map((row) => row.sensorId))),
  );

  readonly hasDecryptedMeasures = computed(() => this.decryptedMeasures().length > 0);

  readonly chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chartInstance: Chart | undefined;

  constructor() {
    effect(() => {
      const canvasRef = this.chartCanvas();
      const rows = this.decryptedMeasures();

      if (!canvasRef) {
        if (this.chartInstance) {
          this.chartInstance.destroy();
          this.chartInstance = undefined;
        }

        return;
      }

      const chartData = this.toChartData(rows);

      const canvas = canvasRef.nativeElement;

      if (this.chartInstance) {
        this.chartInstance.data.labels = chartData.labels;
        this.chartInstance.data.datasets = chartData.datasets;
        this.chartInstance.update('none');
      } else {
        this.chartInstance = new Chart(canvas, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
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
                  autoSkip: true,
                  maxTicksLimit: 6,
                  callback: (tickValue) => {
                    const index = Number(tickValue);

                    if (!this.chartInstance || Number.isNaN(index)) {
                      return '';
                    }

                    const label = this.chartInstance.data.labels?.[index];

                    if (typeof label !== 'string') {
                      return '';
                    }

                    return this.formatTimestamp(label);
                  },
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

  obfuscatedCount(): number {
    return this.measures().filter((row) => !this.isCheckedEnvelope(row)).length;
  }

  private toChartData(rows: CheckedEnvelope[]): {
    labels: string[];
    datasets: Array<{
      label: string;
      data: Array<number | null>;
      borderColor: string;
      backgroundColor: string;
      borderWidth: number;
      fill: boolean;
      tension: number;
      pointRadius: number;
      pointHoverRadius: number;
      spanGaps: boolean;
    }>;
  } {
    const sortedRows = [...rows].sort((left, right) => {
      const leftMs = Date.parse(left.timestamp);
      const rightMs = Date.parse(right.timestamp);

      if (Number.isNaN(leftMs) || Number.isNaN(rightMs)) {
        return left.timestamp.localeCompare(right.timestamp);
      }

      return leftMs - rightMs;
    });

    const recentRows = sortedRows.slice(-MAX_CHART_POINTS);
    const labels = Array.from(new Set(recentRows.map((row) => row.timestamp)));
    const sensorIds = Array.from(new Set(recentRows.map((row) => row.sensorId)));

    const datasets = sensorIds.map((sensorId, index) => {
      const valuesByTimestamp = new Map<string, number>();

      recentRows.forEach((row) => {
        if (row.sensorId === sensorId) {
          valuesByTimestamp.set(row.timestamp, row.value);
        }
      });

      const color = SERIES_COLORS[index % SERIES_COLORS.length];

      return {
        label: sensorId,
        data: labels.map((timestamp) => valuesByTimestamp.get(timestamp) ?? null),
        borderColor: color,
        backgroundColor: this.withAlpha(color, 0.15),
        borderWidth: 2,
        fill: false,
        tension: 0.25,
        pointRadius: 2,
        pointHoverRadius: 4,
        spanGaps: true,
      };
    });

    return {
      labels,
      datasets,
    };
  }

  private withAlpha(color: string, alpha: number): string {
    const normalized = color.replace('#', '');

    if (normalized.length !== 6) {
      return color;
    }

    const red = Number.parseInt(normalized.slice(0, 2), 16);
    const green = Number.parseInt(normalized.slice(2, 4), 16);
    const blue = Number.parseInt(normalized.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  private formatTimestamp(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private isCheckedEnvelope(row: CheckedEnvelope | ObfuscatedEnvelope): row is CheckedEnvelope {
    return 'value' in row;
  }
}
