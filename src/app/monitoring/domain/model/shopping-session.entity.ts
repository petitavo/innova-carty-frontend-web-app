export interface SessionItem {
  sku: string;
  name: string;
  rfidTag: string;
  quantity: number;
  unitPrice: number;
  nominalWeight: number;
}

export interface ShoppingSession {
  id: string;
  cartId: string;
  shopper: string;
  status: 'ACTIVE' | 'PAID' | 'CANCELLED';
  budget: number;
  total: number;
  /** Sum of the nominal weight of the items read by RFID, in grams. */
  expectedWeight: number;
  /** Stable reading of the load cells, in grams. */
  measuredWeight: number;
  /** Allowed difference in grams, from the tolerance of each product. */
  weightTolerance: number;
  startedAt: string;
  items: SessionItem[];
}

export function weightDifference(session: ShoppingSession): number {
  return session.measuredWeight - session.expectedWeight;
}

export function isWeightWithinTolerance(session: ShoppingSession): boolean {
  return Math.abs(weightDifference(session)) <= session.weightTolerance;
}
