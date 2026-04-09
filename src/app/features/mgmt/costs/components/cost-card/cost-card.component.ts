import { Component, computed, input } from '@angular/core';
import { Costs } from '../../../../../core/models/costs';

@Component({
  selector: 'app-cost-card',
  standalone: true,
  templateUrl: './cost-card.component.html',
  styleUrl: './cost-card.component.css',
})
export class CostCardComponent {
  readonly costs = input<Costs | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly storageGb = computed(() => this.toFiniteNumber(this.costs()?.storageGb));
  readonly bandwidthGb = computed(() => this.toFiniteNumber(this.costs()?.bandwidthGb));

  readonly totalGb = computed(() => {
    return this.storageGb() + this.bandwidthGb();
  });

  private toFiniteNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }
}
