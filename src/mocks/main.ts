import { bootstrapApplication } from '@angular/platform-browser';
import { appMockConfig } from './app.config';
import { App } from '../app/app';

async function main() {
  const { worker } = await import('./browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
  bootstrapApplication(App, appMockConfig).catch(console.error);
}

void main();
