import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

type ErrorReason = 'unauthorized' | 'forbidden' | 'not-found' | 'unknown';

interface ErrorCopy {
  title: string;
  message: string;
}

const ERROR_COPY: Record<ErrorReason, ErrorCopy> = {
  unauthorized: {
    title: 'Sessione non autorizzata',
    message:
      'Il backend ha rifiutato la richiesta con errore 401. Puoi provare a ricaricare la pagina.',
  },
  forbidden: {
    title: 'Accesso non consentito',
    message: 'Non hai i permessi necessari per visualizzare questa risorsa.',
  },
  'not-found': {
    title: 'Pagina non trovata',
    message: 'La risorsa richiesta non esiste o e stata spostata.',
  },
  unknown: {
    title: 'Errore applicativo',
    message: 'Si e verificato un errore imprevisto.',
  },
};

@Component({
  selector: 'app-error-page',
  standalone: true,
  templateUrl: './error.page.html',
  styleUrl: './error.page.css',
})
export class ErrorPageComponent {
  private readonly route = inject(ActivatedRoute);

  readonly reason = this.route.snapshot.queryParamMap.get('reason') ?? 'unknown';
  readonly retryUrl = this.resolveRetryUrl(this.route.snapshot.queryParamMap.get('retryUrl'));
  readonly content = this.resolveContent(this.reason);

  reload(): void {
    globalThis.location.assign(this.retryUrl);
  }

  private resolveRetryUrl(retryUrl: string | null): string {
    if (!retryUrl || !retryUrl.startsWith('/') || retryUrl.startsWith('/error')) {
      return '/';
    }

    return retryUrl;
  }

  private resolveContent(reason: string): ErrorCopy {
    switch (reason) {
      case 'unauthorized':
        return ERROR_COPY.unauthorized;
      case 'forbidden':
        return ERROR_COPY.forbidden;
      case 'not-found':
        return ERROR_COPY['not-found'];
      default:
        return ERROR_COPY.unknown;
    }
  }
}
