export interface Store {
  id: number;
  name: string;
  fleetSize: number;
  gatewayStatus: 'ONLINE' | 'OFFLINE';
  avgCheckoutSeconds: number;
  /** Percentage vs. cashier lanes (negative is faster). */
  checkoutTimeVsCashier: number;
  shrinkagePreventedWeek: number;
  discrepanciesSolvedWeek: number;
  lastCatalogSyncAt: string;
}

export interface SessionStat {
  id: number;
  hour: string;
  sessions: number;
}
