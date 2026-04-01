import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  CheckedEnvelope,
  CheckedQueryResPage,
  DecryptedEnvelope,
  ExportParameters,
  QueryParameters,
  QueryResPage,
  StreamParameters,
} from '../../../core/models/measure';
import { MeasureBoundsEvaluationService } from '../../../core/services/measure-bounds-evaluation.service';
import { DecryptedMeasureService } from './decrypted-measure.service';

@Injectable({ providedIn: 'root' })
export class ValidatedMeasureFacadeService {
  private readonly decryptedMeasureService = inject(DecryptedMeasureService);
  private readonly measureBoundsEvaluationService = inject(MeasureBoundsEvaluationService);

  openStream(params: StreamParameters): Observable<CheckedEnvelope> {
    return this.decryptedMeasureService
      .openStream(params)
      .pipe(map((envelope) => this.toCheckedEnvelope(envelope)));
  }

  query(params: QueryParameters): Observable<CheckedQueryResPage> {
    return this.decryptedMeasureService
      .query(params)
      .pipe(map((page) => this.toCheckedQueryResPage(page)));
  }

  export(params: ExportParameters): Observable<CheckedEnvelope> {
    return this.decryptedMeasureService
      .export(params)
      .pipe(map((envelope) => this.toCheckedEnvelope(envelope)));
  }

  closeStream(): void {
    this.decryptedMeasureService.closeStream();
  }

  private toCheckedEnvelope(envelope: DecryptedEnvelope): CheckedEnvelope {
    return {
      ...envelope,
      isOutofBounds: this.measureBoundsEvaluationService.evaluate(envelope),
    };
  }

  private toCheckedQueryResPage(page: QueryResPage): CheckedQueryResPage {
    const mapped: CheckedQueryResPage = {
      data: page.data.map((envelope) => this.toCheckedEnvelope(envelope)),
      hasMore: page.hasMore,
    };

    if (page.nextCursor) {
      mapped.nextCursor = page.nextCursor;
    }

    return mapped;
  }
}
