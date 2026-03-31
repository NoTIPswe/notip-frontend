import { Injectable, Signal, signal, inject } from '@angular/core';
import { finalize, map, Observable } from 'rxjs';
import { StreamStatus } from '../../../core/models/enums';
import {
  ExportParameters,
  ProcessedEnvelope,
  QueryParameters,
  StreamParameters,
  MeasurePage,
} from '../../../core/models/measure';
import { DataEvaluationService } from '../../../core/services/data-evaluation.service';
import { MeasureService } from '../services/measure.service';

@Injectable({ providedIn: 'root' })
export class MeasureFacade {
  private readonly ms = inject(MeasureService);
  private readonly ds = inject(DataEvaluationService);

  private readonly loading = signal(false);
  private readonly measures = signal<ProcessedEnvelope[]>([]);

  openStream(sp: StreamParameters): void {
    this.loading.set(true);

    this.ms
      .openStream(sp)
      .pipe(map((rows) => rows.map((row) => this.evaluate(row))))
      .subscribe({
        next: (rows) => {
          this.measures.set(rows);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  query(qp: QueryParameters): Observable<MeasurePage> {
    this.loading.set(true);

    return this.ms.query(qp).pipe(
      map((page) => {
        const evaluatedRows = page.data.map((row) => this.evaluate(row));
        this.measures.set(evaluatedRows);
        return {
          ...page,
          data: evaluatedRows,
        };
      }),
      finalize(() => {
        this.loading.set(false);
      }),
    );
  }

  export(dp: ExportParameters): void {
    this.loading.set(true);

    this.ms
      .export(dp)
      .pipe(map((rows) => rows.map((row) => this.evaluate(row))))
      .subscribe({
        next: (rows) => {
          this.measures.set(rows);
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
