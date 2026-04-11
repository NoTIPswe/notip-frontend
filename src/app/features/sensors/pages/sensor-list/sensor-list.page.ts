import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Sensor } from '../../../../core/models/sensor';
import { SensorService } from '../../services/sensor.service';
import { RomeDateTimePipe } from '../../../../shared/pipes/rome-date-time.pipe';
import { MultiSelectDropdownComponent } from '../../../../shared/components/multi-select-dropdown/multi-select-dropdown.component';

@Component({
  selector: 'app-sensor-list-page',
  standalone: true,
  imports: [RomeDateTimePipe, MultiSelectDropdownComponent],
  templateUrl: './sensor-list.page.html',
  styleUrl: './sensor-list.page.css',
})
export class SensorListPageComponent implements OnInit {
  private readonly sensorService = inject(SensorService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly sensors = signal<Sensor[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly gatewayFilters = signal<string[]>([]);
  readonly typeFilters = signal<string[]>([]);

  readonly gatewayOptions = computed(() =>
    this.uniqueSorted(this.sensors().map((row) => row.gatewayId)),
  );
  readonly sensorTypeOptions = computed(() =>
    this.uniqueSorted(this.sensors().map((row) => row.sensorType)),
  );

  readonly filteredSensors = computed(() => {
    const gatewayIds = this.gatewayFilters();
    const sensorTypes = this.typeFilters();

    return this.sensors().filter((row) => {
      const gatewayOk = gatewayIds.length === 0 || gatewayIds.includes(row.gatewayId);
      const typeOk = sensorTypes.length === 0 || sensorTypes.includes(row.sensorType);
      return gatewayOk && typeOk;
    });
  });

  ngOnInit(): void {
    this.loadSensors();
  }

  onGatewayFilterChanged(gatewayIds: string[]): void {
    this.gatewayFilters.set(this.normalizeList(gatewayIds));
  }

  onTypeFilterChanged(sensorTypes: string[]): void {
    this.typeFilters.set(this.normalizeList(sensorTypes));
  }

  onClearFilters(): void {
    this.gatewayFilters.set([]);
    this.typeFilters.set([]);
  }

  openSensorDetail(sensorId: string): void {
    void this.router.navigate(['/sensors', sensorId]);
  }

  private loadSensors(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.sensorService
      .getAllSensors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.sensors.set(rows);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Unable to load sensor list.');
        },
      });
  }

  private normalizeList(values: string[]): string[] {
    const unique = new Set<string>();

    for (const value of values) {
      const normalized = value.trim();
      if (normalized.length === 0) {
        continue;
      }

      unique.add(normalized);
    }

    return Array.from(unique);
  }

  private uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values.filter((value) => value.length > 0))).sort((a, b) =>
      a.localeCompare(b),
    );
  }
}
