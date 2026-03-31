import { Component, OnInit, inject, signal } from '@angular/core';
import { CostCardComponent } from '../../components/cost-card/cost-card.component';
import { Costs } from '../../../../../core/models/costs';
import { CostsService } from '../../services/costs.service';

@Component({
  selector: 'app-cost-dashboard-page',
  standalone: true,
  imports: [CostCardComponent],
  templateUrl: './cost-dashboard.page.html',
  styleUrl: './cost-dashboard.page.css',
})
export class CostDashboardPageComponent implements OnInit {
  private readonly costsService = inject(CostsService);

  readonly costs = signal<Costs | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadCosts();
  }

  private loadCosts(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.costsService.getTenantCosts().subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.costs.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossibile caricare i costi tenant.');
      },
    });
  }
}
