export interface Logs {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
}

export interface LogsFilter {
  from: string;
  to: string;
  userId?: string[];
  actions?: string[];
}
