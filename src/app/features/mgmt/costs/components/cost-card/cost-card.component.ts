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

  readonly totalGb = computed(() => {
    const value = this.costs();
    if (!value) {
      return 0;
    }

    return value.storageGb + value.bandwidthGb;
  });
}
