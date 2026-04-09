export * from './app.service';
import { AppService } from './app.service';
export * from './measures.service';
import { MeasuresService } from './measures.service';
export * from './sensors.service';
import { SensorsService } from './sensors.service';
export const APIS = [AppService, MeasuresService, SensorsService];
