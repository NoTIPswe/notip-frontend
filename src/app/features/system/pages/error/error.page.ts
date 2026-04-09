import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

type ErrorReason = 'unauthorized' | 'forbidden' | 'not-found' | 'unknown';

interface ErrorCopy {
  title: string;
  message: string;
}

const ERROR_COPY: Record<ErrorReason, ErrorCopy> = {
  unauthorized: {
    title: 'Unauthorized session',
    message: 'The backend rejected the request with a 401 error. You can try reloading the page.',
  },
  forbidden: {
    title: 'Access denied',
    message: 'You do not have the required permissions to view this resource.',
  },
  'not-found': {
    title: 'Page not found',
    message: 'The requested resource does not exist or has been moved.',
  },
  unknown: {
    title: 'Application error',
    message: 'An unexpected error occurred.',
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
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly reason = computed(() => this.queryParamMap().get('reason') ?? 'unknown');
  readonly retryUrl = computed(() => this.resolveRetryUrl(this.queryParamMap().get('retryUrl')));
  readonly content = computed(() => this.resolveContent(this.reason()));

  reload(): void {
    globalThis.location.assign(this.retryUrl());
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
