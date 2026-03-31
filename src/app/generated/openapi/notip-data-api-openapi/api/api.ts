export * from './app.service';
import { AppService } from './app.service';
export * from './measures.service';
import { MeasuresService } from './measures.service';
export * from './sensor.service';
import { SensorService } from './sensor.service';
export const APIS = [AppService, MeasuresService, SensorService];
