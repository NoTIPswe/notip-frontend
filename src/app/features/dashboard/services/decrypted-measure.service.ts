import { Injectable, inject } from '@angular/core';
import {
  ApiError,
  CryptoSdk,
  DecryptionError,
  type ExportModel,
  type PlaintextMeasure,
  type QueryModel,
  type QueryResponsePage,
  SdkError,
  type StreamModel,
  ValidationError,
} from '@notip/crypto-sdk';
import { from, Observable } from 'rxjs';
import {
  DecryptedEnvelope,
  ExportParameters,
  QueryResPage,
  QueryParameters,
  StreamParameters,
} from '../../../core/models/measure';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class DecryptedMeasureService {
  private readonly auth = inject(AuthService);

  private readonly noStoreFetch: typeof fetch = (input, init) =>
    fetch(input, {
      ...init,
      cache: 'no-store',
    });

  private readonly sdk = new CryptoSdk({
    baseUrl: '/api',
    tokenProvider: () => this.auth.getToken(),
    fetcher: this.noStoreFetch,
  });

  private activeStreamAbortController: AbortController | null = null;

  query(params: QueryParameters): Observable<QueryResPage> {
    return from(
      this.sdk
        .queryMeasures(this.toSdkQueryModel(params))
        .then((page) => this.toInternalMeasurePage(page)),
    );
  }

  openStream(params: StreamParameters): Observable<DecryptedEnvelope> {
    this.closeStream();

    const abortController = new AbortController();
    this.activeStreamAbortController = abortController;

    return this.generatorToObservable(
      this.sdk.streamMeasures(this.toSdkStreamModel(params), abortController.signal),
      abortController,
    );
  }

  export(params: ExportParameters): Observable<DecryptedEnvelope> {
    return this.generatorToObservable(this.sdk.exportMeasures(this.toSdkExportModel(params)));
  }

  closeStream(): void {
    if (!this.activeStreamAbortController) {
      return;
    }

    this.activeStreamAbortController.abort();
    this.activeStreamAbortController = null;
  }

  toSdkQueryModel(params: QueryParameters): QueryModel {
    const model: QueryModel = {
      from: params.from,
      to: params.to,
    };

    if (params.limit > 0) {
      model.limit = params.limit;
    }

    if (params.cursor) {
      model.cursor = params.cursor;
    }

    const gatewayIds = this.asNonEmptyArray(params.gatewayIds);
    if (gatewayIds) {
      model.gatewayId = gatewayIds;
    }

    const sensorIds = this.asNonEmptyArray(params.sensorIds);
    if (sensorIds) {
      model.sensorId = sensorIds;
    }

    const sensorTypes = this.asNonEmptyArray(params.sensorTypes);
    if (sensorTypes) {
      model.sensorType = sensorTypes;
    }

    return model;
  }

  toSdkStreamModel(params: StreamParameters): StreamModel {
    const model: StreamModel = {};

    const gatewayIds = this.asNonEmptyArray(params.gatewayIds);
    if (gatewayIds) {
      model.gatewayId = gatewayIds;
    }

    const sensorIds = this.asNonEmptyArray(params.sensorIds);
    if (sensorIds) {
      model.sensorId = sensorIds;
    }

    const sensorTypes = this.asNonEmptyArray(params.sensorTypes);
    if (sensorTypes) {
      model.sensorType = sensorTypes;
    }

    return model;
  }

  toSdkExportModel(params: ExportParameters): ExportModel {
    const model: ExportModel = {
      from: params.from,
      to: params.to,
    };

    const gatewayIds = this.asNonEmptyArray(params.gatewayIds);
    if (gatewayIds) {
      model.gatewayId = gatewayIds;
    }

    const sensorIds = this.asNonEmptyArray(params.sensorIds);
    if (sensorIds) {
      model.sensorId = sensorIds;
    }

    const sensorTypes = this.asNonEmptyArray(params.sensorTypes);
    if (sensorTypes) {
      model.sensorType = sensorTypes;
    }

    return model;
  }

  toInternalMeasurePage(page: QueryResponsePage): QueryResPage {
    const mapped: QueryResPage = {
      data: page.data.map((row) => this.toInternalDecryptedEnvelope(row)),
      hasMore: page.hasMore,
    };

    if (page.nextCursor) {
      mapped.nextCursor = page.nextCursor;
    }

    return mapped;
  }

  toInternalDecryptedEnvelope(measure: PlaintextMeasure): DecryptedEnvelope {
    return {
      gatewayId: measure.gatewayId,
      sensorId: measure.sensorId,
      sensorType: measure.sensorType,
      timestamp: measure.timestamp,
      value: measure.value,
      unit: measure.unit,
    };
  }

  private generatorToObservable(
    generator: AsyncGenerator<PlaintextMeasure>,
    abortController?: AbortController,
  ): Observable<DecryptedEnvelope> {
    return new Observable<DecryptedEnvelope>((subscriber) => {
      let closed = false;

      const consume = async (): Promise<void> => {
        try {
          for await (const row of generator) {
            if (closed) {
              break;
            }

            subscriber.next(this.toInternalDecryptedEnvelope(row));
          }

          if (!closed) {
            subscriber.complete();
          }
        } catch (error) {
          if (!closed) {
            subscriber.error(this.toError(error));
          }
        } finally {
          if (abortController && this.activeStreamAbortController === abortController) {
            this.activeStreamAbortController = null;
          }
        }
      };

      void consume();

      return () => {
        closed = true;

        if (abortController) {
          abortController.abort();
        }

        void generator.return(undefined);

        if (abortController && this.activeStreamAbortController === abortController) {
          this.activeStreamAbortController = null;
        }
      };
    });
  }

  private asNonEmptyArray(values?: string[]): string[] | undefined {
    if (!values || values.length === 0) {
      return undefined;
    }

    return values;
  }

  private toError(error: unknown): Error {
    if (
      error instanceof SdkError ||
      error instanceof ApiError ||
      error instanceof ValidationError ||
      error instanceof DecryptionError
    ) {
      return error;
    }

    return error instanceof Error ? error : new Error('Crypto SDK data api error');
  }
}
