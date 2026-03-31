import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  AutoRefreshTokenService,
  type IncludeBearerTokenCondition,
  INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
  UserActivityService,
  createInterceptorCondition,
  includeBearerTokenInterceptor,
  provideKeycloak,
  withAutoRefreshToken,
} from 'keycloak-angular';
import { provideApi } from './generated/openapi/notip-management-api-openapi';
import { IMPERSONATION_STATUS, SESSION_LIFECYCLE } from './core/auth/contracts';
import { AuthService } from './core/services/auth.service';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { routes } from './app.routes';

const bearerTokenCondition = createInterceptorCondition<IncludeBearerTokenCondition>({
  urlPattern: /^\/api\/(mgmt|data)(\/.*)?$/i,
});

const keycloakConfig = {
  url: '/auth',
  realm: 'notip',
  clientId: 'web-app',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideKeycloak({
      config: keycloakConfig,
      initOptions: {
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      },
      features: [
        withAutoRefreshToken({
          onInactivityTimeout: 'logout',
          sessionTimeout: 30 * 60 * 1000,
        }),
      ],
      providers: [AutoRefreshTokenService, UserActivityService],
    }),
    {
      provide: INCLUDE_BEARER_TOKEN_INTERCEPTOR_CONFIG,
      useValue: [bearerTokenCondition],
    },
    provideHttpClient(withInterceptors([includeBearerTokenInterceptor, errorInterceptor])),
    provideRouter(routes),
    provideApi('/api/mgmt'),
    { provide: SESSION_LIFECYCLE, useExisting: AuthService },
    { provide: IMPERSONATION_STATUS, useExisting: AuthService },
  ],
};
