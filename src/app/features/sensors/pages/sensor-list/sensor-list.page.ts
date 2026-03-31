import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Sensor } from '../../../../core/models/sensor';
import { SensorService } from '../../services/sensor.service';

@Component({
  selector: 'app-sensor-list-page',
  standalone: true,
  templateUrl: './sensor-list.page.html',
  styleUrl: './sensor-list.page.css',
})
export class SensorListPageComponent implements OnInit {
  private readonly sensorService = inject(SensorService);
  private readonly router = inject(Router);

  readonly sensors = signal<Sensor[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly gatewayFilter = signal<string>('');
  readonly typeFilter = signal<string>('');

  readonly filteredSensors = computed(() => {
    const gateway = this.gatewayFilter().trim().toLowerCase();
    const type = this.typeFilter().trim().toLowerCase();

    return this.sensors().filter((row) => {
      const gatewayOk = gateway.length === 0 || row.gatewayId.toLowerCase().includes(gateway);
      const typeOk = type.length === 0 || row.sensorType.toLowerCase().includes(type);
      return gatewayOk && typeOk;
    });
  });

  ngOnInit(): void {
    this.loadSensors();
  }

  onFilterChanged(gateway: string, sensorType: string): void {
    this.gatewayFilter.set(gateway);
    this.typeFilter.set(sensorType);
  }

  onClearFilters(gatewayInput: HTMLInputElement, typeInput: HTMLInputElement): void {
    gatewayInput.value = '';
    typeInput.value = '';
    this.gatewayFilter.set('');
    this.typeFilter.set('');
  }

  openSensorDetail(sensorId: string): void {
    void this.router.navigate(['/sensors', sensorId]);
  }

  private loadSensors(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.sensorService
      .getAllSensors()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (rows) => {
          this.sensors.set(rows);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Impossibile caricare la lista sensori.');
        },
      });
  }
}
