import { dataApiHandlers } from './data-api';
import { managementApiHandlers } from './management-api';

export const handlers = [...managementApiHandlers, ...dataApiHandlers];
