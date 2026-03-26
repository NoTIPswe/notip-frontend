import { Injectable, Signal, signal, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { IMPERSONATION_STATUS, ImpersonationStatus } from '../../../core/auth/contracts';
import { StreamStatus } from '../../../core/models/enums';
import {
  ExportParameters,
  ProcessedEnvelope,
  QueryParameters,
  StreamParameters,
} from '../../../core/models/measure';
import { DataEvaluationService } from '../../../core/services/data-evaluation.service';
import { CryptoKeyService } from '../../../core/services/crypto-key.service';
import { ThresholdService } from '../../../core/services/threshold.service';
import { WorkerOrchestratorService } from '../../../core/services/worker-orchestrator.service';
import { MeasureService } from '../services/measure.service';

@Injectable({ providedIn: 'root' })
export class MeasureFacade {
  private readonly ms = inject(MeasureService);
  private readonly cks = inject(CryptoKeyService);
  private readonly os = inject(WorkerOrchestratorService);
  private readonly ts = inject(ThresholdService);
  private readonly ds = inject(DataEvaluationService);
  private readonly is = inject<ImpersonationStatus>(IMPERSONATION_STATUS);

  private readonly loading = signal(false);
  private readonly measures = signal<ProcessedEnvelope[]>([]);

  openStream(sp: StreamParameters): void {
    this.loading.set(true);
    this.ts.fetchThresholds().subscribe();
    this.cks.fetchKeys(sp.gatewayIds).subscribe({
      next: (keyMap) => {
        if (Object.keys(keyMap).length > 0) {
          this.os.initializeKeys(keyMap).subscribe();
        }

        this.ms.openStream(sp).subscribe({
          next: (rows) => {
            this.measures.set(rows.map((row) => this.evaluate(row)));
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  query(qp: QueryParameters): void {
    this.loading.set(true);
    this.ms.query(qp).subscribe({
      next: (page) => {
        this.measures.set(page.data.map((row) => this.ms.mapEnvelope(row)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  export(dp: ExportParameters): void {
    this.loading.set(true);
    this.ms.export(dp).subscribe({
      next: (rows) => {
        this.measures.set(rows.map((row) => this.evaluate(row)));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  closeStream(): void {
    this.ms.closeStream();
  }

  streamStatus(): Observable<StreamStatus> {
    return this.ms.streamStatus();
  }

  isImpersonating(): Signal<boolean> {
    return this.is.isImpersonating;
  }

  isLoading(): Signal<boolean> {
    return this.loading.asReadonly();
  }

  processedMeasures(): Signal<ProcessedEnvelope[]> {
    return this.measures.asReadonly();
  }

  private evaluate(row: ProcessedEnvelope): ProcessedEnvelope {
    if (row.type !== 'decrypted') {
      return row;
    }

    return {
      ...row,
      isOutOfBounds: this.ds.evaluate(row),
    };
  }
}
