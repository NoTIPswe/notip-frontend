import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [angular()],
  resolve: {
    alias: {
      '@notip/crypto-sdk': fileURLToPath(
        new URL('./node_modules/@notip/crypto-sdk/dist/index.js', import.meta.url),
      ),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    reporters: [
      'default',
      ['vitest-sonar-reporter', { outputFile: 'coverage/test-reporter.xml' }],
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      include: [
        'src/app/**/services/*.ts',
        'src/app/core/guards/*.ts',
        'src/app/core/interceptors/*.ts',
        'src/app/core/resolvers/*.ts',
        'src/app/app.ts',
        'src/app/shared/components/status-badge/status-badge.component.ts',
        'src/app/features/alerts/components/alert-filter-panel/alert-filter-panel.component.ts',
        'src/app/features/gateways/components/gateway-card/gateway-card.component.ts',
        'src/app/features/gateways/components/gateway-actions/gateway-actions.component.ts',
        'src/app/shared/components/logout-button/logout-button.component.ts',
        'src/app/shared/components/sidebar/sidebar.component.ts',
        'src/app/shared/components/delete-confirm-modal/delete-confirm-modal.component.ts',
        'src/app/features/admin/components/impersonate-button/impersonate-button.component.ts',
        'src/app/features/admin/components/admin-gateway-form/admin-gateway-form.component.ts',
        'src/app/features/admin/components/tenant-form/tenant-form.component.ts',
        'src/app/features/alerts/components/alert-config-form/alert-config-form.component.ts',
        'src/app/features/dashboard/components/filter-panel/filter-panel.component.ts',
        'src/app/features/dashboard/components/telemetry-chart/telemetry-chart.component.ts',
        'src/app/features/dashboard/components/telemetry-table/telemetry-table.component.ts',
        'src/app/features/gateways/components/command-modal/command-modal.component.ts',
        'src/app/features/mgmt/api-clients/components/api-client-table/api-client-table.component.ts',
        'src/app/features/mgmt/thresholds/components/threshold-form/threshold-form.component.ts',
        'src/app/features/mgmt/thresholds/components/threshold-table/threshold-table.component.ts',
        'src/app/features/mgmt/users/components/user-form/user-form.component.ts',
        'src/app/features/mgmt/users/components/user-table/user-table.component.ts',
      ],
      exclude: ['**/*.spec.ts'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
