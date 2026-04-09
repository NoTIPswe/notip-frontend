import { Injectable, inject } from '@angular/core';
import { EMPTY, Subscription, catchError, switchMap, timer } from 'rxjs';
import { UserRole } from '../models/enums';
import { AuthService } from './auth.service';
import { ThresholdService } from './threshold.service';

@Injectable({ providedIn: 'root' })
export class ThresholdPrefetchService {
  private static readonly REFRESH_INTERVAL_MS = 5 * 60 * 1000;

  private readonly thresholdService = inject(ThresholdService);
  private readonly authService = inject(AuthService);

  private refreshSub: Subscription | null = null;

  constructor() {
    this.authService.logout$.subscribe(() => {
      this.stop();
      this.thresholdService.invalidateCache();
    });
  }

  start(): void {
    if (this.refreshSub || !this.shouldStart()) {
      return;
    }

    this.refreshSub = timer(0, ThresholdPrefetchService.REFRESH_INTERVAL_MS)
      .pipe(
        switchMap(() =>
          this.thresholdService.fetchThresholds().pipe(
            // Keep the scheduler alive even when the endpoint is temporarily unavailable.
            catchError(() => EMPTY),
          ),
        ),
      )
      .subscribe();
  }

  stop(): void {
    if (!this.refreshSub) {
      return;
    }

    this.refreshSub.unsubscribe();
    this.refreshSub = null;
  }

  private shouldStart(): boolean {
    if (this.authService.getRole() === UserRole.system_admin) {
      return false;
    }

    const tenantId = this.authService.getTenantId().trim();
    return tenantId.length > 0;
  }
}
